// Content script for Naukri.com job page detection and data extraction
class NaukriJobExtractor {
    constructor() {
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.detectJobPage();
        this.observePageChanges();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'extractJobData') {
                this.extractJobData()
                    .then(jobData => sendResponse({ jobData }))
                    .catch(error => sendResponse({ error: error.message }));
                return true; // Keep message channel open for async response
            }
        });
    }

    detectJobPage() {
        const isJobPage = this.isNaukriJobPage();
        if (isJobPage) {
            console.log('Naukri job page detected');
            // Always reset UI when detecting a new job page
            this.resetJobAnalysisUI();
            this.injectJobAnalysisUI();
        } else {
            // Remove UI if not on a job page
            this.removeJobAnalysisUI();
        }
    }

    isNaukriJobPage() {
        const url = window.location.href;
        const isJobListingPage = url.includes('naukri.com/job-listings-');
        
        console.log('Naukri Job Page Check:', {
            url: url,
            isJobListingPage: isJobListingPage,
            result: isJobListingPage
        });
        
        return isJobListingPage;
    }

    async extractJobData() {
        if (!this.isNaukriJobPage()) {
            throw new Error('Not on a Naukri job page');
        }

        const jobData = {
            title: this.extractJobTitle(),
            company: this.extractCompanyName(),
            location: this.extractLocation(),
            description: this.extractJobDescription(),
            requirements: this.extractRequirements(),
            skills: this.extractSkills(),
            experience: this.extractExperienceLevel(),
            jobType: this.extractJobType(),
            salary: this.extractSalary(),
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            platform: 'naukri'
        };

        console.log('Extracted Naukri job data:', jobData);
        return jobData;
    }

    extractJobTitle() {
        console.log('🏷️ Extracting Naukri job title...');
        
        // Naukri job title selectors
        const selectors = [
            '.jd-header-title',
            '.jobTitle',
            '.job-title',
            'h1[class*="title"]',
            '.title',
            'h1.jobTitle',
            '.jd-header h1',
            '.job-header h1',
            '[data-qa="job-title"]',
            '.job-post-name'
        ];

        for (const selector of selectors) {
            console.log(`  Trying selector: ${selector}`);
            const elements = document.querySelectorAll(selector);
            
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element && element.textContent.trim()) {
                    const text = this.cleanText(element.textContent);
                    console.log(`    Found candidate: "${text}"`);
                    
                    // Validate job title
                    if (this.isValidJobTitle(text)) {
                        console.log(`  ✅ Selected job title: "${text}"`);
                        return text;
                    }
                }
            }
        }

        // Enhanced fallback: analyze all H1 elements
        console.log('  🔄 Trying H1 fallback...');
        const h1Elements = document.querySelectorAll('h1');
        for (const h1 of h1Elements) {
            const text = this.cleanText(h1.textContent);
            if (this.isValidJobTitle(text)) {
                console.log(`  ✅ Selected job title (fallback): "${text}"`);
                return text;
            }
        }

        console.log('  ❌ No valid job title found');
        return 'Job Title Not Found';
    }

    isValidJobTitle(text) {
        return text && 
               text.length >= 5 && 
               text.length <= 200 && 
               !text.toLowerCase().includes('naukri') &&
               !text.toLowerCase().includes('sign in') &&
               !text.toLowerCase().includes('profile') &&
               !text.toLowerCase().includes('home') &&
               !text.toLowerCase().includes('search') &&
               !text.toLowerCase().includes('jobs in') &&
               !text.toLowerCase().includes('register');
    }

    extractCompanyName() {
        console.log('🏢 Extracting Naukri company name...');
        
        const selectors = [
            '.jd-header-comp-name',
            '.companyName',
            '.company-name',
            '.comp-name',
            '.jd-comp-name',
            '[data-qa="company-name"]',
            '.company',
            '.employer-name',
            '.hiring-company',
            'a[title*="company"]'
        ];

        for (const selector of selectors) {
            console.log(`  Trying selector: ${selector}`);
            const elements = document.querySelectorAll(selector);
            
            for (const element of elements) {
                if (element && element.textContent.trim()) {
                    const text = this.cleanText(element.textContent);
                    console.log(`    Found candidate: "${text}"`);
                    
                    if (this.isValidCompanyName(text)) {
                        console.log(`  ✅ Selected company: "${text}"`);
                        return text;
                    }
                }
            }
        }

        console.log('  ❌ No valid company name found');
        return 'Company Not Found';
    }

    isValidCompanyName(text) {
        return text && 
               text.length >= 2 && 
               text.length <= 100 &&
               !text.toLowerCase().includes('see more') &&
               !text.toLowerCase().includes('follow') &&
               !text.toLowerCase().includes('naukri') &&
               !text.toLowerCase().includes('•') &&
               !text.toLowerCase().includes('view all jobs');
    }

    extractLocation() {
        const selectors = [
            '.jd-header-comp-location',
            '.locWdth',
            '.location',
            '.job-location',
            '.jd-location',
            '[data-qa="job-location"]',
            '.loc',
            '.job-loc'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return this.cleanText(element.textContent);
            }
        }

        return '';
    }

    extractJobDescription() {
        console.log('📝 Extracting Naukri job description...');
        
        const selectors = [
            '.jobDescStyle',
            '.job-description',
            '.jd-description',
            '.job-details',
            '.job-desc',
            '.description',
            '.jdDet',
            '.jobDesc',
            '[data-qa="job-description"]',
            '.job-summary',
            '.job-content'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                const text = this.cleanText(element.textContent);
                if (this.isValidJobDescription(text)) {
                    console.log(`  ✅ Selected description: ${text.length} characters`);
                    return text;
                }
            }
        }

        // Enhanced fallback: try to find any element with substantial job-related content
        console.log('  🔄 Trying fallback selectors...');
        const fallbackSelectors = [
            '[class*="description"]',
            '[class*="job-details"]',
            '[class*="jd"]'
        ];

        for (const selector of fallbackSelectors) {
            console.log(`    Trying fallback: ${selector}`);
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = this.cleanText(element.textContent);
                if (this.isValidJobDescription(text)) {
                    console.log(`  ✅ Selected description (fallback): ${text.length} characters`);
                    return text;
                }
            }
        }

        console.log('  ❌ No valid job description found');
        return 'Job description not found';
    }

    isValidJobDescription(text) {
        if (!text || text.length < 100) return false;
        
        const lowerText = text.toLowerCase();
        const jobKeywords = [
            'responsibilities', 'requirements', 'experience', 'role', 'position',
            'duties', 'skills', 'qualifications', 'candidate', 'looking for',
            'job description', 'about the role', 'what you will do'
        ];
        
        return jobKeywords.some(keyword => lowerText.includes(keyword));
    }

    extractSalary() {
        const selectors = [
            '.salary',
            '.sal',
            '.package',
            '.ctc',
            '.compensation',
            '[data-qa="salary"]',
            '.salary-range'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                const text = this.cleanText(element.textContent);
                if (text && text.length > 0 && !text.toLowerCase().includes('not disclosed')) {
                    return text;
                }
            }
        }

        return 'Not disclosed';
    }

    extractRequirements() {
        const description = this.extractJobDescription();
        const requirements = [];

        // Look for common requirement patterns
        const requirementPatterns = [
            /(?:requirements?|qualifications?|must have|required|essential)[\s\S]*?(?=(?:responsibilities|duties|benefits|we offer|about|company|equal opportunity)|$)/gi,
            /(?:experience with|proficient in|knowledge of|familiar with)[\s\S]*?(?=\n\n|\.|;)/gi,
            /(?:\d+\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp))/gi,
            /(?:degree|diploma|certification|qualified)[\s\S]*?(?=\n\n|\.|;)/gi
        ];

        requirementPatterns.forEach(pattern => {
            const matches = description.match(pattern);
            if (matches) {
                requirements.push(...matches.map(match => this.cleanText(match)));
            }
        });

        return requirements;
    }

    extractSkills() {
        const description = this.extractJobDescription().toLowerCase();
        const commonSkills = [
            // Programming languages
            'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust', 'swift', 'kotlin',
            'typescript', 'scala', 'r', 'matlab', 'sql', 'html', 'css', 'dart', 'perl', 'vb.net',
            
            // Frameworks and libraries
            'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
            'rails', 'bootstrap', 'jquery', 'redux', 'nextjs', 'nuxtjs', 'react native', 'flutter',
            
            // Databases
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite', 'cassandra',
            
            // Cloud and DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd', 'terraform',
            'ansible', 'puppet', 'chef',
            
            // Tools and technologies
            'figma', 'sketch', 'photoshop', 'illustrator', 'jira', 'confluence', 'slack',
            'tableau', 'powerbi', 'excel', 'salesforce', 'sap', 'oracle erp',
            
            // Testing
            'selenium', 'junit', 'testng', 'cypress', 'jest', 'mocha', 'postman',
            
            // Methodologies
            'agile', 'scrum', 'kanban', 'devops', 'tdd', 'bdd', 'waterfall',
            
            // Soft skills
            'leadership', 'teamwork', 'communication', 'project management', 'problem solving',
            'analytical thinking', 'time management'
        ];

        const foundSkills = commonSkills.filter(skill => 
            description.includes(skill.toLowerCase())
        );

        return foundSkills;
    }

    extractExperienceLevel() {
        const description = this.extractJobDescription().toLowerCase();
        
        // Look for Naukri-specific experience indicators
        if (description.includes('senior') || description.includes('lead') || description.includes('principal') || description.includes('architect')) {
            return 'Senior';
        } else if (description.includes('junior') || description.includes('entry') || description.includes('graduate') || description.includes('fresher')) {
            return 'Junior';
        } else if (description.includes('mid') || description.includes('intermediate') || description.includes('associate')) {
            return 'Mid-level';
        }
        
        // Look for years of experience
        const yearMatches = description.match(/(\d+)\+?\s*(?:years?|yrs?)/gi);
        if (yearMatches) {
            const years = parseInt(yearMatches[0]);
            if (years <= 2) return 'Junior';
            if (years <= 5) return 'Mid-level';
            return 'Senior';
        }

        // Check URL for experience pattern (common in Naukri URLs)
        const urlMatch = window.location.href.match(/(\d+)-to-(\d+)-years/);
        if (urlMatch) {
            const maxYears = parseInt(urlMatch[2]);
            if (maxYears <= 2) return 'Junior';
            if (maxYears <= 5) return 'Mid-level';
            return 'Senior';
        }

        return 'Not specified';
    }

    extractJobType() {
        const description = this.extractJobDescription().toLowerCase();
        
        if (description.includes('work from home') || description.includes('remote')) return 'Remote';
        if (description.includes('hybrid')) return 'Hybrid';
        if (description.includes('on-site') || description.includes('onsite') || description.includes('office')) return 'On-site';
        
        return 'Not specified';
    }

    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/[^\x00-\x7F]/g, ' ') // Remove non-ASCII characters
            .trim();
    }

    // UI injection for job analysis
    resetJobAnalysisUI() {
        // Remove existing button if present
        this.removeJobAnalysisUI();
    }

    removeJobAnalysisUI() {
        const existingButton = document.getElementById('ai-resume-analysis-btn-naukri');
        if (existingButton) {
            existingButton.remove();
            console.log('Removed existing Naukri job analysis UI');
        }
    }

    injectJobAnalysisUI() {
        // Target elements specific to Naukri layout
        const targetSelectors = [
            '.jd-header',
            '.job-header',
            '.jobTitle',
            '.jd-header-title',
            '.job-detail-header'
        ];

        let targetElement = null;
        for (const selector of targetSelectors) {
            targetElement = document.querySelector(selector);
            if (targetElement) {
                console.log(`Found target element: ${selector}`);
                break;
            }
        }

        if (targetElement) {
            const analysisBtn = this.createAnalysisButton();
            targetElement.parentNode.insertBefore(analysisBtn, targetElement.nextSibling);
        } else {
            console.log('No suitable target element found for Naukri UI injection');
        }
    }

    createAnalysisButton() {
        const button = document.createElement('div');
        button.id = 'ai-resume-analysis-btn-naukri';
        
        const buttonElement = document.createElement('div');
        buttonElement.style.cssText = `
            margin: 16px 0;
            padding: 12px 16px;
            background: #4285f4;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            text-align: center;
            transition: background-color 0.2s;
            font-size: 14px;
            user-select: none;
            max-width: 300px;
            box-shadow: 0 2px 4px rgba(66, 133, 244, 0.3);
        `;
        buttonElement.textContent = '🤖 Customize Resume with AI';
        buttonElement.setAttribute('data-original-text', '🤖 Customize Resume with AI');
        
        // Add event listeners instead of inline handlers
        buttonElement.addEventListener('mouseover', () => {
            buttonElement.style.background = '#3367d6';
        });
        
        buttonElement.addEventListener('mouseout', () => {
            buttonElement.style.background = '#4285f4';
        });
        
        buttonElement.addEventListener('click', () => {
            this.triggerAIAnalysis();
        });

        button.appendChild(buttonElement);
        return button;
    }

    async triggerAIAnalysis() {
        try {
            const button = document.getElementById('ai-resume-analysis-btn-naukri');
            const buttonElement = button.querySelector('div');
            const originalText = buttonElement.getAttribute('data-original-text') || '🤖 Customize Resume with AI';
            
            button.innerHTML = `
                <div style="
                    margin: 16px 0;
                    padding: 12px 16px;
                    background: #666;
                    color: white;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                    max-width: 300px;
                ">
                    ⏳ Analyzing Naukri job posting...
                </div>
            `;

            // Extract job data and send to extension
            console.log('Starting Naukri job data extraction...');
            const jobData = await this.extractJobData();
            console.log('Naukri job data extracted:', jobData);
            
            // Validate job data
            if (!jobData.title || jobData.title === 'Job Title Not Found') {
                throw new Error('Could not extract job title. Please make sure you are on a Naukri job posting page.');
            }

            if (!jobData.description || jobData.description === 'Job description not found') {
                throw new Error('Could not extract job description. The page might still be loading.');
            }

            // Send message to background script to trigger popup analysis
            const response = await chrome.runtime.sendMessage({
                action: 'jobAnalyzed',
                jobData: jobData
            });

            console.log('Message sent to background script, response:', response);

            // Show success state
            button.innerHTML = `
                <div style="
                    margin: 16px 0;
                    padding: 12px 16px;
                    background: #10b981;
                    color: white;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                    max-width: 300px;
                ">
                    ✅ Job analyzed! Open extension popup to customize resume.
                </div>
            `;

            // Show notification
            this.showNotification('Naukri job analyzed successfully! Click the extension icon to customize your resume.', 'success');

            setTimeout(() => {
                // Reset button to original state
                button.innerHTML = `
                    <div style="
                        margin: 16px 0;
                        padding: 12px 16px;
                        background: #4285f4;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        text-align: center;
                        transition: background-color 0.2s;
                        font-size: 14px;
                        user-select: none;
                        max-width: 300px;
                        box-shadow: 0 2px 4px rgba(66, 133, 244, 0.3);
                    " data-original-text="${originalText}">
                        ${originalText}
                    </div>
                `;
                // Re-attach event listeners
                const newButtonElement = button.querySelector('div');
                newButtonElement.addEventListener('mouseover', () => {
                    newButtonElement.style.background = '#3367d6';
                });
                newButtonElement.addEventListener('mouseout', () => {
                    newButtonElement.style.background = '#4285f4';
                });
                newButtonElement.addEventListener('click', () => {
                    this.triggerAIAnalysis();
                });
            }, 5000);

        } catch (error) {
            console.error('Naukri analysis error:', error);
            
            const button = document.getElementById('ai-resume-analysis-btn-naukri');
            button.innerHTML = `
                <div style="
                    margin: 16px 0;
                    padding: 12px 16px;
                    background: #ef4444;
                    color: white;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                    max-width: 300px;
                ">
                    ❌ ${error.message || 'Analysis failed. Try again.'}
                </div>
            `;

            // Show error notification
            this.showNotification('Naukri job analysis failed: ' + (error.message || 'Unknown error'), 'error');

            setTimeout(() => {
                // Reset button to original state after error
                const originalText = '🤖 Customize Resume with AI';
                button.innerHTML = `
                    <div style="
                        margin: 16px 0;
                        padding: 12px 16px;
                        background: #4285f4;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        text-align: center;
                        transition: background-color 0.2s;
                        font-size: 14px;
                        user-select: none;
                        max-width: 300px;
                        box-shadow: 0 2px 4px rgba(66, 133, 244, 0.3);
                    " data-original-text="${originalText}">
                        ${originalText}
                    </div>
                `;
                // Re-attach event listeners
                const newButtonElement = button.querySelector('div');
                newButtonElement.addEventListener('mouseover', () => {
                    newButtonElement.style.background = '#3367d6';
                });
                newButtonElement.addEventListener('mouseout', () => {
                    newButtonElement.style.background = '#4285f4';
                });
                newButtonElement.addEventListener('click', () => {
                    this.triggerAIAnalysis();
                });
            }, 5000);
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.ai-resume-notification-naukri');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `ai-resume-notification-naukri ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#4285f4'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 400px;
            font-size: 14px;
            font-family: Arial, sans-serif;
        `;
        notification.innerHTML = message;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Observe page changes (Naukri may use dynamic loading)
    observePageChanges() {
        let lastUrl = window.location.href;
        
        // Monitor URL changes and major DOM changes
        const observer = new MutationObserver((mutations) => {
            let urlChanged = false;
            let significantChange = false;
            
            // Check if URL changed
            if (window.location.href !== lastUrl) {
                urlChanged = true;
                lastUrl = window.location.href;
                console.log('Naukri URL changed to:', lastUrl);
            }

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check for significant content changes
                    const hasJobContent = Array.from(mutation.addedNodes).some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            return node.className && (
                                node.className.includes('jd-header') ||
                                node.className.includes('job-header') ||
                                node.className.includes('jobDesc') ||
                                node.className.includes('job-details')
                            );
                        }
                        return false;
                    });
                    
                    if (hasJobContent) {
                        significantChange = true;
                    }
                }
            });

            // React to URL changes or significant content changes
            if (urlChanged || significantChange) {
                console.log('Naukri page change detected, re-detecting job page...');
                setTimeout(() => {
                    this.detectJobPage();
                }, 1000); // Wait for content to load
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', () => {
            console.log('Naukri popstate event detected');
            setTimeout(() => {
                this.detectJobPage();
            }, 500);
        });

        // Monitor for hash changes
        window.addEventListener('hashchange', () => {
            console.log('Naukri hash change detected');
            setTimeout(() => {
                this.detectJobPage();
            }, 500);
        });
    }
}

// Initialize the Naukri extractor
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NaukriJobExtractor();
    });
} else {
    new NaukriJobExtractor();
}