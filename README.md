# KUPOSU AI Resume Maker - Chrome Extension

A powerful Chrome extension that uses AI to automatically customize your resume to match job postings from LinkedIn and Naukri.com, improving your ATS (Applicant Tracking System) score and chances of getting hired.

![KUPOSU AI Resume Maker](https://via.placeholder.com/800x400/4285f4/ffffff?text=KUPOSU+AI+Resume+Maker)

## 🌟 Features

### ✨ Core Functionality
- **🤖 AI-Powered Customization**: Uses OpenAI GPT-4o-mini to intelligently tailor your resume to specific job postings
- **📊 ATS Score Calculation**: Real-time keyword matching and score optimization (target 80%+)
- **🔍 Multi-Platform Integration**: Automatically detects and extracts job data from LinkedIn and Naukri job pages
- **📄 Multiple Export Formats**: Download customized resumes as styled PDF or Word DOC files
- **📚 Customization History**: Complete history of all AI-generated resumes with download options
- **💰 Coin-Based System**: Fair usage system with Razorpay payment integration

### 🎯 Smart Features
- **📝 Resume Parsing**: Upload existing resume (PDF/DOC/TXT) and auto-extract data
- **🎨 Professional Blue Theme**: Modern, ATS-friendly design with professional blue accents
- **🏷️ Keyword Optimization**: Intelligent keyword matching and density optimization
- **📋 Work Experience Management**: Drag-and-drop reordering and comprehensive editing
- **🔄 Auto-save**: Automatic saving of profile data and work experience
- **📊 Real-time ATS Scoring**: Live feedback on resume optimization

### 🛡️ Security & Privacy
- **🔒 Secure Backend**: JWT-based authentication with encrypted data storage
- **🚫 Privacy First**: Your data is securely stored and never shared
- **⚡ Fast Processing**: Optimized Rails backend for lightning-fast responses

## 🚀 Quick Start

### 1. Installation

#### Development Setup
```bash
# Clone the frontend repository
git clone https://github.com/devboy-eng/JobExtension_Frontend.git
cd JobExtension_Frontend

# Clone the backend repository
git clone https://github.com/devboy-eng/JobExtension_Backend.git

# Setup backend (Rails)
cd JobExtension_Backend
bundle install
ruby run_migrations.rb
ruby start_rails_server.rb

# Setup frontend (Chrome Extension)
cd ../
# Load extension in Chrome developer mode
```

#### Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project directory
4. The extension icon will appear in your toolbar

### 2. Backend Setup (Rails)

1. Copy the environment template:
```bash
cd JobExtension_Backend
cp .env.example .env
```

2. Configure your API keys in `.env`:
```env
OPENAI_API_KEY=sk-your-openai-key-here
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
DATABASE_USER=nagarjun
DATABASE_PASSWORD=
JWT_SECRET=your-secure-jwt-secret
```

3. Start the Rails server:
```bash
ruby start_rails_server.rb
# Server runs on http://localhost:4003
```

### 3. Usage

1. **Setup Profile**: Click the extension icon and fill in your profile information
2. **Upload Resume**: (Optional) Upload your existing resume for auto-parsing
3. **Browse Jobs**: Navigate to a LinkedIn or Naukri job posting
4. **Customize**: Click "Analyze Job & Customize Resume" in the extension popup
5. **Download**: Review the customized resume and download as PDF/DOC

## 🌐 Supported Job Platforms

### LinkedIn Jobs
- **URL Pattern**: `https://www.linkedin.com/jobs/*`
- **Coverage**: Global job market
- **Features**: Full integration with LinkedIn's job posting structure
- **Data Extraction**: Title, Company, Location, Description, Requirements, Skills

### Naukri.com Jobs  
- **URL Pattern**: `https://www.naukri.com/job-listings-*`
- **Coverage**: India's largest job portal
- **Features**: Naukri-specific data extraction and UI integration
- **Data Extraction**: Title, Company, Location, Salary, Description, Experience Level

### Coming Soon
- Indeed.com integration
- Monster.com integration
- AngelList/Wellfound integration

## 📁 Project Structure

```
JobExtension_Frontend/         # Chrome Extension Frontend
├── manifest.json              # Chrome extension manifest (v3)
├── popup/                     # Extension popup interface
│   ├── popup.html            # Main UI with tabbed interface
│   ├── popup.css             # Professional blue theme styles
│   └── popup.js              # Complete frontend logic
├── content/                   # Job platform integration
│   ├── content.js            # LinkedIn job data extraction
│   ├── naukri-content.js     # Naukri job data extraction
│   └── content.css           # Content script styles
├── background/                # Service worker
│   └── background.js         # Background processes
├── icons/                     # Extension icons (16, 32, 48, 128px)
└── README.md                 # Frontend documentation

JobExtension_Backend/          # Rails API Backend (Separate Repo)
├── app/
│   ├── controllers/          # API controllers
│   │   ├── ai_controller.rb  # AI customization
│   │   ├── auth_controller.rb # JWT authentication
│   │   ├── downloads_controller.rb # PDF/DOC generation
│   │   ├── payments_controller.rb # Razorpay integration
│   │   └── ...              # Other controllers
│   └── models/              # ActiveRecord models
├── config/                   # Rails configuration
├── db/migrate/              # Database migrations
├── start_rails_server.rb    # Custom startup script
└── README.md               # Backend documentation
```

## 🔧 Configuration

### AI Provider Setup

#### OpenAI GPT-4o-mini (Default)
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env`: `OPENAI_API_KEY=sk-your-key`
3. The system uses GPT-4o-mini for optimal cost and performance balance

### Payment Setup

#### Razorpay Integration
1. Get keys from [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Add to `.env`: 
   ```env
   RAZORPAY_KEY_ID=your-key-id
   RAZORPAY_KEY_SECRET=your-key-secret
   ```
3. Configure webhook for automatic coin crediting

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

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /verify-email` - Email verification

### AI & Resume Processing
- `POST /api/ai/customize` - AI resume customization with ATS optimization
- `POST /api/resume/ats-score` - Calculate ATS compatibility score
- `POST /api/parse-resume` - Parse uploaded resume files (PDF/DOC/TXT)

### Document Generation
- `POST /api/download/pdf` - Generate styled PDF resume
- `POST /api/download/doc` - Generate Word DOC resume (RTF format)

### Profile & History
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Update user profile
- `GET /api/customization-history` - Get all customization history

### Payment & Coins
- `GET /api/coins/balance` - Get current coin balance
- `POST /api/payment/create-order` - Create Razorpay payment order
- `POST /api/payment/webhook` - Payment webhook handler

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

#### Job Platform Detection Issues

**LinkedIn:**
- Refresh the LinkedIn job page
- Ensure you're on a job posting URL (contains `/jobs/`)
- Check browser console for errors

**Naukri:**
- Refresh the Naukri job page
- Ensure you're on a job listing URL (contains `/job-listings-`)
- Wait for the page to fully load before clicking the extension

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