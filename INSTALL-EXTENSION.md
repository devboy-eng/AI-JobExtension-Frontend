# How to Install the KUPOSU AI Resume Maker Chrome Extension

## 📱 **Chrome Extension Installation**

### **Method 1: Developer Mode (Recommended)**

1. **Open Chrome** and go to: `chrome://extensions/`

2. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**:
   - Click "Load unpacked" button
   - Navigate to: `/Users/nagarjun/Desktop/ai-resume-chrome-extension/`
   - Click "Select Folder"

4. **Verify Installation**:
   - You should see "KUPOSU AI Resume Maker" in your extensions list
   - Look for the extension icon in your browser toolbar

### **Method 2: ZIP Package**

If you prefer a ZIP file:

```bash
# Create a ZIP package
cd /Users/nagarjun/Desktop/ai-resume-chrome-extension
zip -r ai-resume-extension.zip . -x "node_modules/*" "*.git/*" "electron-*" "debug-*" "setup-*" "fix-*" "verify-*" "assets/*" "dist/*" "*.md"
```

Then load the ZIP in Chrome.

## 🖥️ **Desktop App Troubleshooting**

### **Finding the System Tray Icon**

**On macOS:**
1. Look in the **menu bar** at the top-right of your screen
2. Check near: WiFi, Bluetooth, battery, time icons
3. Look for a **small blue/gray icon**
4. The icon might be **very small** (16px)

**If you can't find it:**
1. Try **Command + Space** and search "KUPOSU AI"
2. Check **Activity Monitor** for "Electron" processes
3. The app might be running but icon is hidden

### **Force Show Desktop Window**

If the tray icon is invisible, you can force open the window by running:

```bash
# This command will force show the main window
osascript -e 'tell application "System Events" to keystroke "space" using {command down, option down}'
```

Or restart the desktop app:

```bash
# Kill and restart
pkill -f "Electron.*ai-resume"
npm run electron
```

## 🔧 **Quick Test Commands**

### **Test if Extension Works:**
1. Open Chrome
2. Go to any LinkedIn job posting
3. Click the extension icon
4. Login with: `nagarjunbhoopalam@gmail.com` / `test123456`

### **Test if Desktop App Works:**
1. Look in menu bar for tray icon (KUPOSU AI)
2. Click it to open sidebar
3. Same login credentials
4. Should overlay on top of other windows

## 🆘 **Troubleshooting**

### **Extension Not Loading:**
- Make sure you're in the correct folder
- Check that `manifest.json` exists
- Enable Developer Mode first

### **Desktop Icon Missing:**
- Check if other apps are hiding the icon
- Try restarting the desktop app
- Look carefully in the menu bar - it's small!

### **Login Issues:**
- Both apps use the same backend
- Make sure backend is running: `node start-backend.js`
- Use credentials: `nagarjunbhoopalam@gmail.com` / `test123456`

---

**Need help?** The desktop app is definitely running (I can see the processes), so the icon should be in your menu bar somewhere!