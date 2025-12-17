const { app, BrowserWindow, Tray, Menu, screen, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let tray = null;
let mainWindow = null;
let floatingButton = null;
let backendProcess = null;
let isQuitting = false;

// Backend server management
function startBackendServer() {
    console.log('Starting backend server...');
    backendProcess = spawn('node', ['start-backend.js'], {
        stdio: 'inherit',
        cwd: __dirname
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend server:', err);
    });

    backendProcess.on('exit', (code, signal) => {
        console.log(`Backend server exited with code ${code} and signal ${signal}`);
    });
}

function stopBackendServer() {
    if (backendProcess) {
        console.log('Stopping backend server...');
        backendProcess.kill('SIGTERM');
        backendProcess = null;
    }
}

function createFloatingButton() {
    // Get screen dimensions
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    // Create small floating circular button
    floatingButton = new BrowserWindow({
        width: 100,
        height: 100,
        x: width - 150, // Position on right side with margin
        y: 100, // Position at top right for visibility
        show: false, // Start hidden, then show after loading
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        transparent: true,
        hasShadow: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false, // Allow data URLs
            preload: path.join(__dirname, 'electron-preload.js')
        }
    });

    // Load the floating button HTML file
    floatingButton.loadFile('floating-button.html');

    // Show the button after content loads
    floatingButton.once('ready-to-show', () => {
        console.log('Floating button ready, showing now...');
        floatingButton.show();
        floatingButton.focus();
    });

    floatingButton.webContents.on('did-finish-load', () => {
        console.log('Floating button content loaded');
        floatingButton.show();
    });

    // Handle button click to open main window
    floatingButton.on('closed', () => {
        floatingButton = null;
    });

    // Debug: log when button is created
    console.log('Floating button created at position:', width - 150, 100);
    console.log('Screen dimensions:', width, height);
}

function createWindow() {
    // Get screen dimensions
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    // Create sidebar window
    mainWindow = new BrowserWindow({
        width: 400,
        height: height - 100, // Leave some margin
        x: width - 420, // Position on the right side
        y: 50, // Small top margin
        show: false, // Don't show initially
        frame: false, // Remove window frame for overlay effect
        alwaysOnTop: true, // Stay on top of other windows
        skipTaskbar: true, // Don't show in taskbar
        resizable: false,
        transparent: true, // Enable transparency for rounded corners
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            preload: path.join(__dirname, 'electron-preload.js')
        }
    });

    // Load the popup HTML
    mainWindow.loadFile('popup/popup.html');

    // Handle window close
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // Auto-hide when clicking outside
    mainWindow.on('blur', () => {
        if (!mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.hide();
        }
    });
}

function createTray() {
    // Try multiple icon paths as fallback
    let iconPath;
    const possiblePaths = [
        path.join(__dirname, 'assets', 'tray-icon.png'),
        path.join(__dirname, 'assets', 'tray-icon-simple.png'),
        path.join(__dirname, 'assets', 'tray-icon.svg')
    ];
    
    const fs = require('fs');
    for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
            iconPath = testPath;
            break;
        }
    }
    
    // If no icon found, create a simple one
    if (!iconPath) {
        iconPath = createFallbackIcon();
    }
    
    try {
        tray = new Tray(iconPath);
    } catch (error) {
        console.log('Error loading icon, using fallback:', error.message);
        // Fallback to native image
        const img = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFASURBVDiNpZM9SwNBEIafgwQLwcJCG1sLwcJCG9sLwUKwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQ');
        tray = new Tray(img);
    }
    
    // Set tooltip
    tray.setToolTip('KUPOSU AI Resume Maker');
    
    // Handle click events
    tray.on('click', () => {
        toggleWindow();
    });
    
    // Context menu
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open KUPOSU AI Resume Maker',
            click: () => showWindow()
        },
        {
            label: 'Hide',
            click: () => hideWindow()
        },
        { type: 'separator' },
        {
            label: 'Show Floating Button',
            click: () => {
                if (!floatingButton) {
                    createFloatingButton();
                } else {
                    floatingButton.show();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setContextMenu(contextMenu);
}

function createFallbackIcon() {
    // Create a simple programmatic icon
    const img = nativeImage.createEmpty();
    img.addRepresentation({
        scaleFactor: 1.0,
        width: 16,
        height: 16,
        buffer: Buffer.alloc(16 * 16 * 4, 100) // Gray 16x16 image
    });
    return img;
}

function createTrayIcon() {
    // Create a simple icon programmatically (this creates a 16x16 PNG)
    const iconSize = 16;
    const canvas = require('canvas').createCanvas ? 
        require('canvas').createCanvas(iconSize, iconSize) : 
        createFallbackIcon();
    
    if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        
        // Draw a simple AI-themed icon
        ctx.fillStyle = '#3b82f6'; // Blue background
        ctx.beginPath();
        ctx.arc(8, 8, 7, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw "AI" text
        ctx.fillStyle = 'white';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AI', 8, 11);
        
        // Save to temp file
        const fs = require('fs');
        const tmpPath = path.join(__dirname, 'temp-icon.png');
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(tmpPath, buffer);
        return tmpPath;
    } else {
        // Fallback: create a simple icon file
        return createFallbackIcon();
    }
}

function createFallbackIcon() {
    const fs = require('fs');
    const tmpPath = path.join(__dirname, 'temp-icon.png');
    
    // Create a simple 16x16 PNG icon (minimal PNG data)
    const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        // ... simplified PNG data for a blue square
    ]);
    
    // For simplicity, let's create a data URL icon
    const nativeImg = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafgwQLwcJCG1sLwcJCG9sLwUKwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwULCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLCwULCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQsLCwsLBQ');
    
    // Save the icon
    const iconPath = path.join(__dirname, 'tray-icon.png');
    fs.writeFileSync(iconPath, nativeImg.toPNG());
    
    return iconPath;
}

function toggleWindow() {
    if (mainWindow.isVisible()) {
        hideWindow();
    } else {
        showWindow();
    }
}

function showWindow() {
    mainWindow.show();
    mainWindow.focus();
}

function hideWindow() {
    mainWindow.hide();
}

// IPC handlers
ipcMain.handle('open-sidebar', () => {
    showWindow();
});

ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.handle('window-close', () => {
    if (mainWindow) {
        mainWindow.hide();
    }
});

ipcMain.handle('close-floating-button', () => {
    if (floatingButton) {
        floatingButton.close();
        floatingButton = null;
    }
});

// App event handlers
app.whenReady().then(() => {
    // Check if backend is already running, if not start it
    checkAndStartBackend();
    
    // Create UI components
    createWindow();
    createTray();
    createFloatingButton();
});

function checkAndStartBackend() {
    const http = require('http');
    const options = {
        hostname: 'localhost',
        port: 4003,
        path: '/health',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log('Backend server is already running');
        } else {
            startBackendServer();
        }
    });

    req.on('error', (err) => {
        console.log('Backend not running, starting server...');
        startBackendServer();
    });

    req.end();
}

app.on('window-all-closed', () => {
    // Keep app running even when all windows are closed (system tray app)
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    isQuitting = true;
    stopBackendServer();
    if (floatingButton) {
        floatingButton.close();
    }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, show our window instead
        showWindow();
    });
}