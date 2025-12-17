# AI Resume Customizer - Desktop App

## Overview

The AI Resume Customizer is now available as a cross-platform desktop application! This Electron-based app provides the same powerful AI resume customization features in a convenient desktop format with system tray integration.

## Features

### 🖥️ Desktop Integration
- **System Tray Icon**: AI Resume Customizer icon appears in your system tray
- **Overlay Sidebar**: Click the tray icon to open a sidebar that overlays on top of other applications
- **Always Accessible**: No need to open a browser - instant access to resume customization

### 💰 Coin System
- **Coin Balance**: Real-time coin balance display in the header
- **Recharge Options**: Multiple coin packages (100, 250, 500 coins)
- **Transaction History**: Track all coin purchases and usage
- **Cost**: 10 coins per AI resume customization

### 🤖 AI-Powered Features
- **Resume Customization**: AI analyzes job descriptions and customizes your resume
- **ATS Optimization**: Improves ATS (Applicant Tracking System) scores
- **Professional Summaries**: Generates clean, professional resume summaries
- **Keyword Matching**: Dynamic keyword extraction and optimization

### 🔐 User Management
- **Secure Authentication**: JWT-based login system
- **User-Specific Data**: Each user's data is completely isolated
- **Profile Management**: Store and manage multiple work experiences and certificates

## Installation & Setup

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager

### Quick Start
1. **Clone or download** the project files
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the desktop app**:
   ```bash
   npm run electron
   ```

### Development Mode
```bash
# Start with development features
npm run electron-dev
```

## Usage Instructions

### First-Time Setup
1. **Launch the app** using `npm run electron`
2. **Look for the AI icon** in your system tray (notification area)
3. **Click the tray icon** to open the sidebar
4. **Sign up** for a new account or **login** with existing credentials

### System Tray Interaction
- **Single Click**: Toggle sidebar visibility
- **Right Click**: Context menu with options:
  - Open AI Resume Customizer
  - Hide
  - Quit

### Sidebar Features
- **Responsive Design**: Sidebar adapts to your screen height
- **Auto-Hide**: Clicks outside the sidebar automatically hide it
- **Always on Top**: Sidebar stays visible over other applications

### Coin Management
1. **View Balance**: Coin count is displayed in the header (🪙 number)
2. **Click Coin Balance**: Shows transaction history in the Account tab
3. **Recharge Coins**: Choose from preset packages or enter custom amount
4. **Track Usage**: Each AI customization costs 10 coins

### Resume Customization
1. **Complete Your Profile**: Fill in personal information and work experience
2. **Get Job Data**: Copy job description from LinkedIn or other job sites
3. **Analyze & Customize**: Click "Analyze Job & Customize Resume"
4. **Review Results**: Get customized resume with ATS score
5. **Download**: Save as PDF or Word document

## Backend Integration

The desktop app automatically manages the backend server:
- **Auto-Detection**: Checks if backend is already running
- **Auto-Start**: Starts backend server if needed
- **Port 4003**: Backend runs on localhost:4003
- **Health Monitoring**: Monitors backend connectivity

## Building for Distribution

### Create Installers
```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist:win    # Windows installer
npm run dist:mac    # macOS DMG
npm run dist:linux  # Linux AppImage
```

### Distribution Files
- **Windows**: `.exe` installer in `dist/` folder
- **macOS**: `.dmg` file in `dist/` folder
- **Linux**: `.AppImage` file in `dist/` folder

## Technical Details

### Architecture
- **Frontend**: HTML/CSS/JavaScript (same as Chrome extension)
- **Backend**: Node.js Express server with authentication
- **Framework**: Electron for cross-platform desktop support
- **Security**: Contextual isolation and secure preload scripts

### File Structure
```
├── electron-main.js          # Main Electron process
├── electron-preload.js       # Preload script for security
├── popup/                    # Frontend UI files (HTML/CSS/JS)
├── assets/                   # Icons and static assets
├── start-backend.js          # Backend server
└── dist/                     # Built installers (after npm run dist)
```

### Platform Support
- ✅ **Windows** 10/11 (64-bit)
- ✅ **macOS** 10.14+ (Intel & Apple Silicon)
- ✅ **Linux** (Ubuntu, Debian, CentOS, etc.)

## Troubleshooting

### Common Issues

#### Tray Icon Not Visible
- Check your system tray settings
- Look for hidden icons in the system tray overflow
- Restart the application

#### Backend Connection Issues
- Ensure port 4003 is available
- Check firewall settings
- Try manual backend start: `node start-backend.js`

#### Coin System Issues
- Verify you're logged in
- Check network connection
- Refresh the application

#### Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install

# Clear Electron cache
npm run electron -- --clear-cache
```

### Development Debugging
```bash
# Enable Electron dev tools
npm run electron-dev

# View backend logs
node start-backend.js
```

## Support

For issues, feature requests, or contributions:
1. Check the troubleshooting section above
2. Review console logs (F12 in the app)
3. Check backend server logs
4. Create an issue with detailed information

## Version History

### v1.0.0 - Desktop Release
- Initial desktop app release
- System tray integration
- Overlay sidebar functionality
- Full feature parity with Chrome extension
- Cross-platform support (Windows, macOS, Linux)

---

**Enjoy your new desktop AI Resume Customizer! 🚀**