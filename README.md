# AI Resume Customizer Chrome Extension

A powerful Chrome extension that uses AI to automatically customize your resume to match LinkedIn job postings, improving your ATS (Applicant Tracking System) score and chances of getting hired.

![AI Resume Customizer](https://via.placeholder.com/800x400/2563eb/ffffff?text=AI+Resume+Customizer)

## 🌟 Features

### ✨ Core Functionality
- **🤖 AI-Powered Customization**: Uses OpenAI/Gemini to tailor your resume to specific job postings
- **📊 ATS Score Calculation**: Real-time keyword matching and score optimization (target 85%+)
- **🔍 LinkedIn Integration**: Automatically detects and extracts job data from LinkedIn job pages
- **📄 Multiple Export Formats**: Download customized resumes as PDF or DOC files
- **📚 Version Management**: Save and manage multiple resume versions for different roles

### 🎯 Smart Features
- **📝 Resume Parsing**: Upload existing resume (PDF/DOC) and auto-extract data
- **🎨 Professional Templates**: Modern, ATS-friendly templates that match your reference CV
- **🏷️ Keyword Optimization**: Intelligent keyword matching and density optimization
- **💡 Improvement Suggestions**: AI-generated recommendations for better job matching
- **🔄 Auto-save**: Automatic saving of profile data and work experience

### 🛡️ Security & Privacy
- **🔒 Local Storage**: Profile data stored locally in your browser
- **🚫 No Data Collection**: Your information never leaves your device (except for AI processing)
- **⚡ Fast Processing**: Optimized for speed and minimal resource usage

## 🚀 Quick Start

### 1. Installation

#### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/ai-resume-chrome-extension.git
cd ai-resume-chrome-extension

# Install dependencies
npm install

# Install backend dependencies
npm run install-backend

# Start development servers
npm run dev-all
```

#### Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project directory
4. The extension icon will appear in your toolbar

### 2. Backend Setup

1. Copy the environment template:
```bash
cd backend
cp .env.example .env
```

2. Configure your AI API keys in `.env`:
```env
OPENAI_API_KEY=sk-your-openai-key-here
# OR
GEMINI_API_KEY=your-gemini-key-here
```

3. Start the backend server:
```bash
npm run start-backend
```

### 3. Usage

1. **Setup Profile**: Click the extension icon and fill in your profile information
2. **Upload Resume**: (Optional) Upload your existing resume for auto-parsing
3. **Browse Jobs**: Navigate to a LinkedIn job posting
4. **Customize**: Click "Analyze Job & Customize Resume" in the extension popup
5. **Download**: Review the customized resume and download as PDF/DOC

## 📁 Project Structure

```
ai-resume-chrome-extension/
├── manifest.json              # Chrome extension manifest
├── popup/                     # Extension popup interface
│   ├── popup.html            # Main UI
│   ├── popup.css             # Styles
│   └── popup.js              # Frontend logic
├── content/                   # LinkedIn page integration
│   ├── content.js            # Job data extraction
│   └── content.css           # Content script styles
├── background/                # Service worker
│   └── background.js         # Background processes
├── backend/                   # Node.js API server
│   ├── server.js             # Express server
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic
│   ├── utils/                # Utilities
│   └── templates/            # Resume templates
├── icons/                     # Extension icons
├── scripts/                   # Build scripts
└── package.json              # Dependencies
```

## 🔧 Configuration

### AI Provider Setup

#### OpenAI (Recommended)
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env`: `OPENAI_API_KEY=sk-your-key`
3. Set provider: `AI_PROVIDER=openai`

#### Google Gemini
1. Get API key from [Google AI Studio](https://makersuite.google.com/)
2. Add to `.env`: `GEMINI_API_KEY=your-key`
3. Set provider: `AI_PROVIDER=gemini`

### Backend Deployment

#### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd backend
railway login
railway deploy
```

#### Render
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy from the `backend` directory

#### Local Development
```bash
# Start backend on port 3000
cd backend
npm run dev

# Start frontend on port 4002
npm run dev
```

## 🔨 Development

### Available Scripts

```bash
# Development
npm run dev                    # Start frontend dev server (port 4002)
npm run start-backend         # Start backend dev server (port 3000)
npm run dev-all               # Start both servers concurrently

# Building
npm run validate              # Validate extension files
npm run build                 # Build for production
npm run zip                   # Create distribution ZIP

# Testing
npm test                      # Run tests
npm run lint                  # Lint code
```

### File Watching

The development server automatically reloads when you make changes to:
- `popup/popup.js`
- `popup/popup.css`
- `content/content.js`
- `background/background.js`

### Testing

```bash
# Run all tests
npm test

# Test specific components
npm test -- popup
npm test -- content
npm test -- background
```

## 📋 API Endpoints

### Resume Generation
- `POST /api/resume/generate` - Generate PDF/DOC resume
- `POST /api/resume/preview` - Generate HTML preview
- `POST /api/resume/ats-score` - Calculate ATS score

### Document Parsing
- `POST /api/parse/resume` - Parse uploaded resume file
- `POST /api/parse/job-text` - Parse job description text

### AI Processing
- `POST /api/ai/customize` - Customize resume with AI
- `POST /api/ai/suggestions` - Get improvement suggestions
- `POST /api/ai/optimize-keywords` - Optimize for ATS

## 🎨 Templates

The extension includes multiple professional resume templates:

- **Modern** (Default): Clean, contemporary design
- **Classic**: Traditional layout for conservative industries  
- **Creative**: Eye-catching design for creative roles
- **Minimal**: Simple, content-focused design

Templates are fully customizable and ATS-optimized.

## 🔍 ATS Optimization

The extension optimizes your resume for ATS systems by:

1. **Keyword Matching**: Identifies and includes relevant keywords from job postings
2. **Format Optimization**: Uses ATS-friendly formatting and structure
3. **Content Enhancement**: Rephrases experience to match job requirements
4. **Score Calculation**: Provides real-time ATS match percentage
5. **Improvement Suggestions**: Offers specific recommendations

## 🛠️ Troubleshooting

### Common Issues

#### Extension Not Loading
- Check if all required files are present
- Run `npm run validate` to check for issues
- Reload the extension in `chrome://extensions/`

#### AI Not Working
- Verify API key is correctly set in backend `.env`
- Check backend server is running on port 3000
- Ensure network connectivity to AI service

#### LinkedIn Detection Issues
- Refresh the LinkedIn job page
- Ensure you're on a job posting URL (contains `/jobs/`)
- Check browser console for errors

#### Backend Connection Failed
- Verify backend server is running: `npm run start-backend`
- Check CORS settings in `server.js`
- Update backend URL in extension settings

### Debug Mode

Enable debug logging by adding to localStorage:
```javascript
localStorage.setItem('ai-resume-debug', 'true');
```

## 📦 Building for Production

1. **Validate Extension**:
```bash
npm run validate
```

2. **Create Production Build**:
```bash
npm run build
npm run zip
```

3. **Upload to Chrome Web Store**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
   - Upload the generated `dist/extension.zip`
   - Fill in store listing details
   - Submit for review

## 🚀 Deployment

### Backend Deployment

#### Environment Variables Required:
```env
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
AI_PROVIDER=openai
ALLOWED_ORIGINS=chrome-extension://your-extension-id
```

#### Deploy to Railway:
```bash
cd backend
railway deploy
```

#### Deploy to Render:
1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables

### Chrome Web Store Submission

1. **Prepare Assets**:
   - 128x128 icon
   - Screenshots (1280x800)
   - Promotional tile (440x280)
   - Store description

2. **Privacy Policy**: Required for extensions that handle user data

3. **Submit**: Upload ZIP file and complete store listing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Test on multiple browsers
- Ensure Chrome Web Store compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT API
- [Google](https://ai.google.dev/) for Gemini API
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [LinkedIn](https://linkedin.com/) for inspiration

## 📞 Support

- 🐛 [Report Bug](https://github.com/yourusername/ai-resume-chrome-extension/issues)
- 💡 [Request Feature](https://github.com/yourusername/ai-resume-chrome-extension/issues)
- 📧 [Contact](mailto:your.email@example.com)
- 📚 [Documentation](https://github.com/yourusername/ai-resume-chrome-extension/wiki)

---

**Made with ❤️ for job seekers everywhere**

*Helping you land your dream job, one optimized resume at a time.*