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
                backendUrl: 'http://localhost:4003',
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
You are an expert resume writer and ATS optimization specialist. Please analyze the following job posting and candidate profile, then create a customized resume that maximizes ATS match score and appeal to recruiters.

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location}
Description: ${jobData.description}
Required Skills: ${jobData.skills.join(', ')}
Experience Level: ${jobData.experience}

CANDIDATE PROFILE:
Name: ${profileData.name}
Current Title: ${profileData.designation}
Email: ${profileData.email}
Phone: ${profileData.phone}
Skills: ${profileData.skills}
Work Experience: ${JSON.stringify(profileData.workExperience || [])}
Education: ${profileData.education}
Languages: ${profileData.languages}

TASKS:
1. Customize the resume content to match job requirements
2. Optimize keywords for ATS systems
3. Highlight relevant experience and skills
4. Calculate ATS match percentage
5. Provide improvement recommendations

RESPONSE FORMAT (JSON):
{
    "customizedContent": "HTML formatted resume content",
    "atsScore": 85,
    "keywordsMatched": ["keyword1", "keyword2"],
    "keywordsMissing": ["missing1", "missing2"],
    "recommendations": ["Add more React experience", "Include certifications"]
}

Focus on making the resume highly relevant to the job posting while maintaining truthfulness about the candidate's experience.
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