const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.invoke('window-minimize'),
    close: () => ipcRenderer.invoke('window-close'),
    openSidebar: () => ipcRenderer.invoke('open-sidebar'),
    closeFloatingButton: () => ipcRenderer.invoke('close-floating-button'),
    
    // App info
    getVersion: () => ipcRenderer.invoke('get-version'),
    
    // Platform detection
    platform: process.platform,
    
    // Check if running in Electron
    isElectron: true
});

// Override some browser-specific APIs that don't work in Electron
window.addEventListener('DOMContentLoaded', () => {
    // Disable chrome extension APIs that won't work in Electron
    if (typeof chrome !== 'undefined') {
        // Keep chrome object but make storage work with localStorage fallback
        const originalChrome = window.chrome;
        window.chrome = {
            ...originalChrome,
            storage: {
                local: {
                    get: (keys) => {
                        return new Promise((resolve) => {
                            const result = {};
                            if (Array.isArray(keys)) {
                                keys.forEach(key => {
                                    const value = localStorage.getItem(key);
                                    if (value) {
                                        result[key] = JSON.parse(value);
                                    }
                                });
                            } else if (typeof keys === 'string') {
                                const value = localStorage.getItem(keys);
                                if (value) {
                                    result[keys] = JSON.parse(value);
                                }
                            }
                            resolve(result);
                        });
                    },
                    set: (items) => {
                        return new Promise((resolve) => {
                            Object.keys(items).forEach(key => {
                                localStorage.setItem(key, JSON.stringify(items[key]));
                            });
                            resolve();
                        });
                    },
                    remove: (keys) => {
                        return new Promise((resolve) => {
                            if (Array.isArray(keys)) {
                                keys.forEach(key => localStorage.removeItem(key));
                            } else {
                                localStorage.removeItem(keys);
                            }
                            resolve();
                        });
                    }
                }
            },
            tabs: {
                // Mock chrome.tabs API
                query: () => Promise.resolve([]),
                sendMessage: () => Promise.resolve(null)
            },
            runtime: {
                // Mock chrome.runtime API
                sendMessage: () => Promise.resolve(null),
                onMessage: {
                    addListener: () => {}
                }
            }
        };
    }
});