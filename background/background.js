// Background service worker for Chrome extension
class BackgroundService {
    constructor() {
        this.init();
    }

    init() {
        this.setupMessageListeners();
        this.setupStorageDefaults();
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'jobAnalyzed':
                    this.handleJobAnalyzed(request.jobData);
                    break;
                case 'customizeResume':
                    this.customizeResumeWithAI(request.jobData, request.profileData)
                        .then(result => sendResponse(result))
                        .catch(error => sendResponse({ error: error.message }));
                    return true; // Keep message channel open
                case 'generateResume':
                    this.generateResumeFile(request.data, request.format)
                        .then(result => sendResponse(result))
                        .catch(error => sendResponse({ error: error.message }));
                    return true;
                default:
                    break;
            }
        });

        // Handle installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.handleInstallation();
            }
        });
    }

    async setupStorageDefaults() {
        const defaults = {
            settings: {
                aiProvider: 'openai', // 'openai' or 'gemini'
                apiKey: '',
                backendUrl: 'https://ai-jobextension-backend.onrender.com',
                autoSave: true,
                notifications: true
            },
            schema: {
                version: '1.0',
                resumeStructure: {
                    personalInfo: {
                        name: 'string',
                        designation: 'string',
                        email: 'string',
                        phone: 'string',
                        address: 'string',
                        linkedin: 'string'
                    },
                    workExperience: 'array',
                    skills: 'array',
                    education: 'string',
                    languages: 'array'
                }
            }
        };

        const stored = await chrome.storage.local.get(['settings', 'schema']);
        
        if (!stored.settings) {
            await chrome.storage.local.set({ settings: defaults.settings });
        }
        
        if (!stored.schema) {
            await chrome.storage.local.set({ schema: defaults.schema });
        }
    }

    handleInstallation() {
        chrome.tabs.create({
            url: chrome.runtime.getURL('popup/popup.html') + '?welcome=true'
        });
    }

    handleJobAnalyzed(jobData) {
        // Store the analyzed job data
        chrome.storage.local.set({ 
            lastAnalyzedJob: {
                ...jobData,
                analyzedAt: new Date().toISOString()
            }
        });

        // Send notification to user (if popup is open)
        chrome.runtime.sendMessage({
            action: 'jobDataReady',
            jobData: jobData
        }).catch(() => {
            // Popup might not be open, that's fine
        });
    }

    async customizeResumeWithAI(jobData, profileData) {
        try {
            const settings = await this.getSettings();
            
            if (!settings.apiKey) {
                throw new Error('AI API key not configured. Please set it in extension settings.');
            }

            const aiResponse = await this.callAIService(jobData, profileData, settings);
            
            const customizedResume = {
                content: aiResponse.customizedContent,
                atsScore: aiResponse.atsScore || this.calculateATSScore(jobData, profileData),
                keywordsMatched: aiResponse.keywordsMatched || [],
                keywordsMissing: aiResponse.keywordsMissing || [],
                recommendations: aiResponse.recommendations || [],
                generatedAt: new Date().toISOString()
            };

            // Store the customized resume
            await chrome.storage.local.set({ lastCustomizedResume: customizedResume });

            return customizedResume;

        } catch (error) {
            console.error('AI customization error:', error);
            throw error;
        }
    }

    async callAIService(jobData, profileData, settings) {
        const prompt = this.buildAIPrompt(jobData, profileData);
        
        if (settings.aiProvider === 'openai') {
            return await this.callOpenAI(prompt, settings.apiKey);
        } else if (settings.aiProvider === 'gemini') {
            return await this.callGemini(prompt, settings.apiKey);
        } else {
            throw new Error('Invalid AI provider configuration');
        }
    }

    buildAIPrompt(jobData, profileData) {
        return `
You are an expert ATS (Applicant Tracking System) resume optimization specialist. Create a HIGHLY ATS-OPTIMIZED resume that will pass automated screening and rank high for this specific job.

=== JOB POSTING ANALYSIS ===
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location}
Full Description: ${jobData.description}
Required Skills: ${jobData.skills.join(', ')}
Experience Level: ${jobData.experience}

=== CANDIDATE INFORMATION ===
Name: ${profileData.name}
Current Role: ${profileData.designation}
Email: ${profileData.email}
Phone: ${profileData.phone}
LinkedIn: ${profileData.linkedin || 'Not provided'}
Address: ${profileData.address || 'Not provided'}
Skills: ${profileData.skills}
Work Experience: ${JSON.stringify(profileData.workExperience || [])}
Education: ${profileData.education}
Languages: ${profileData.languages}
Certificates: ${JSON.stringify(profileData.certificates || [])}

=== CRITICAL ATS REQUIREMENTS ===
You MUST create a resume following these STRICT ATS guidelines:

1. **PROFESSIONAL SUMMARY**: 3-4 lines tailored to job, include exact job title, incorporate 3-5 key skills, quantify achievements
2. **KEYWORD OPTIMIZATION**: Extract ALL keywords from job description, match EXACT phrasing, ensure 70-80% keyword match rate
3. **CORE SKILLS SECTION**: List 10-15 most relevant skills, prioritize job requirements, use exact terminology
4. **WORK EXPERIENCE**: Strong action verbs, quantified achievements, mirror job language, 3-5 bullets per role
5. **ATS-FRIENDLY FORMATTING**: Clean minimalist design, Arial/Calibri fonts, clear sections, standard bullets, no graphics
6. **SECTION ORDER**: Contact → Summary → Skills → Experience → Education → Certifications → Languages

=== RESPONSE FORMAT (JSON) ===
{
    "customizedContent": "Complete HTML formatted resume following ALL ATS guidelines above",
    "professionalSummary": "The generated professional summary text",
    "atsScore": 85,
    "keywordsExtracted": ["all", "keywords", "from", "job"],
    "keywordsMatched": ["keywords", "successfully", "included"],
    "keywordsMissing": ["keywords", "not", "included"],
    "matchPercentage": "75%",
    "coreSkills": ["skill1", "skill2", "skill3"],
    "recommendations": ["Specific actionable recommendations"],
    "atsCompliance": {"formatting": true, "keywords": true, "structure": true, "readability": true}
}

CRITICAL: Resume MUST be 100% ATS-compliant, use ONLY provided info, optimize for major ATS systems (Taleo, Workday, iCIMS), maintain professional tone.
        `;
    }

    async callOpenAI(prompt, apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert resume writer specializing in ATS optimization.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
            return JSON.parse(content);
        } catch (e) {
            // Fallback if AI doesn't return valid JSON
            return {
                customizedContent: content,
                atsScore: 75,
                keywordsMatched: [],
                keywordsMissing: [],
                recommendations: []
            };
        }
    }

    async callGemini(prompt, apiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2000
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text;
        
        try {
            return JSON.parse(content);
        } catch (e) {
            return {
                customizedContent: content,
                atsScore: 75,
                keywordsMatched: [],
                keywordsMissing: [],
                recommendations: []
            };
        }
    }

    calculateATSScore(jobData, profileData) {
        const jobSkills = jobData.skills || [];
        const profileSkills = (profileData.skills || '').toLowerCase().split(',').map(s => s.trim());
        
        if (jobSkills.length === 0) return 0;
        
        const matchedSkills = jobSkills.filter(skill => 
            profileSkills.some(profileSkill => 
                profileSkill.includes(skill.toLowerCase()) || 
                skill.toLowerCase().includes(profileSkill)
            )
        );
        
        const score = (matchedSkills.length / jobSkills.length) * 100;
        return Math.round(score);
    }

    async generateResumeFile(resumeData, format) {
        try {
            const settings = await this.getSettings();
            
            // Call backend API to generate PDF/DOC file
            const response = await fetch(`${settings.backendUrl}/generate-resume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: resumeData.content,
                    format: format, // 'pdf' or 'doc'
                    template: 'modern' // Can be configurable
                })
            });

            if (!response.ok) {
                throw new Error(`Backend API error: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Trigger download
            const filename = `resume_${Date.now()}.${format}`;
            await chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: true
            });

            return { success: true, filename };

        } catch (error) {
            console.error('Resume generation error:', error);
            throw error;
        }
    }

    async getSettings() {
        const stored = await chrome.storage.local.get('settings');
        return stored.settings || {};
    }

    // Utility functions for data management
    async exportUserData() {
        const data = await chrome.storage.local.get();
        const exportData = {
            profile: data.profile,
            workExperiences: data.workExperiences,
            resumeVersions: data.resumeVersions,
            settings: data.settings,
            exportedAt: new Date().toISOString()
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    async importUserData(importData) {
        try {
            const data = JSON.parse(importData);
            
            // Validate data structure
            if (!data.profile && !data.workExperiences) {
                throw new Error('Invalid import data format');
            }
            
            await chrome.storage.local.set({
                profile: data.profile,
                workExperiences: data.workExperiences,
                resumeVersions: data.resumeVersions || [],
                settings: { ...await this.getSettings(), ...data.settings }
            });
            
            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            throw new Error('Failed to import data: ' + error.message);
        }
    }

    // Analytics and tracking (privacy-focused)
    async trackUsage(eventType, eventData = {}) {
        const settings = await this.getSettings();
        
        if (!settings.analytics) return; // Respect user privacy settings
        
        const event = {
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString(),
            extensionVersion: chrome.runtime.getManifest().version
        };
        
        // Store locally for now (could send to analytics service if user consents)
        const stored = await chrome.storage.local.get('usageStats');
        const stats = stored.usageStats || [];
        stats.push(event);
        
        // Keep only last 100 events to avoid storage bloat
        if (stats.length > 100) {
            stats.splice(0, stats.length - 100);
        }
        
        await chrome.storage.local.set({ usageStats: stats });
    }
}

// Initialize the background service
new BackgroundService();