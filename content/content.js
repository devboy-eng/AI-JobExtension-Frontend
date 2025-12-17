// Content script for LinkedIn job page detection and data extraction
class LinkedInJobExtractor {
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
                // Only respond if we're on a LinkedIn page
                if (this.isLinkedInJobPage()) {
                    this.extractJobData()
                        .then(jobData => sendResponse({ jobData }))
                        .catch(error => sendResponse({ error: error.message }));
                    return true; // Keep message channel open for async response
                }
                // Don't respond if not on LinkedIn - let other content scripts handle it
            }
        });
    }

    detectJobPage() {
        const isJobPage = this.isLinkedInJobPage();
        if (isJobPage) {
            console.log('LinkedIn job page detected');
            // Always reset UI when detecting a new job page
            this.resetJobAnalysisUI();
            this.injectJobAnalysisUI();
        } else {
            // Remove UI if not on a job page
            this.removeJobAnalysisUI();
        }
    }

    isLinkedInJobPage() {
        const url = window.location.href;
        const isJobsPage = url.includes('linkedin.com/jobs');
        const hasJobId = url.includes('currentJobId=') || url.includes('/view/') || url.includes('/jobs/');
        
        console.log('LinkedIn Job Page Check:', {
            url: url,
            isJobsPage: isJobsPage,
            hasJobId: hasJobId,
            result: isJobsPage && hasJobId
        });
        
        return isJobsPage && hasJobId;
    }

    async extractJobData() {
        if (!this.isLinkedInJobPage()) {
            throw new Error('Not on a LinkedIn job page');
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
            url: window.location.href,
            extractedAt: new Date().toISOString()
        };

        console.log('Extracted job data:', jobData);
        return jobData;
    }

    extractJobTitle() {
        console.log('🏷️ Extracting job title...');
        
        // Updated selectors for December 2024 LinkedIn layout
        const selectors = [
            // Primary LinkedIn job title selectors
            '.job-details-jobs-unified-top-card__job-title h1',
            '.jobs-unified-top-card__job-title h1',
            '.job-details-jobs-unified-top-card__job-title a',
            '.jobs-unified-top-card__job-title a',
            
            // Alternative selectors
            'h1[data-test-id*="job-title"]',
            '.t-24.t-bold', // LinkedIn typography classes
            'h1.job-title',
            
            // Fallback selectors
            'h1.top-card-layout__title',
            '.job-details__job-title h1',
            'h1.jobs-details__job-title',
            '[class*="job-title"] h1',
            '[class*="title"] h1'
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
               !text.toLowerCase().includes('linkedin') &&
               !text.toLowerCase().includes('sign in') &&
               !text.toLowerCase().includes('profile') &&
               !text.toLowerCase().includes('home') &&
               !text.toLowerCase().includes('search');
    }

    extractCompanyName() {
        console.log('🏢 Extracting company name...');
        
        const selectors = [
            '.job-details-jobs-unified-top-card__company-name a',
            '.job-details-jobs-unified-top-card__company-name',
            '.jobs-unified-top-card__company-name a',
            '.jobs-unified-top-card__company-name',
            '.jobs-unified-top-card__subtitle',
            'a[data-test-id*="company"]',
            'a[data-test-id="job-detail-company-link"]',
            '.topcard__flavor--company a',
            '.company-name',
            '[class*="company"] a'
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
               !text.toLowerCase().includes('linkedin') &&
               !text.toLowerCase().includes('•');
    }

    extractLocation() {
        const selectors = [
            '.job-details-jobs-unified-top-card__bullet',
            '.jobs-unified-top-card__bullet',
            '.topcard__flavor--bullet',
            'span[data-test-id="job-location"]'
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
        const selectors = [
            '.jobs-description-content__text',
            '.job-view-layout .jobs-description',
            '.jobs-box__html-content',
            '.jobs-description__content',
            '.jobs-description',
            '.job-details-jobs-unified-top-card__job-description',
            '[data-test-id*="job-description"]',
            '.jobs-details__job-description',
            '.artdeco-card .jobs-description',
            '.jobs-description-content',
            '.job-description-content'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return this.cleanText(element.textContent);
            }
        }

        // Enhanced fallback: try to find any element with substantial job-related content
        console.log('  🔄 Trying fallback selectors...');
        const fallbackSelectors = [
            '[class*="description"]',
            '[class*="job-details"]',
            '.artdeco-card'
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
            'duties', 'skills', 'qualifications', 'candidate', 'looking for'
        ];
        
        return jobKeywords.some(keyword => lowerText.includes(keyword));
    }

    extractRequirements() {
        const description = this.extractJobDescription();
        const requirements = [];

        // Look for common requirement patterns
        const requirementPatterns = [
            /(?:requirements?|qualifications?|must have|required)[\s\S]*?(?=(?:responsibilities|duties|benefits|we offer|about|company|equal opportunity)|$)/gi,
            /(?:experience with|proficient in|knowledge of|familiar with)[\s\S]*?(?=\n\n|\.|;)/gi,
            /(?:\d+\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp))/gi
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
            'typescript', 'scala', 'r', 'matlab', 'sql', 'html', 'css',
            
            // Frameworks and libraries
            'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
            'rails', 'bootstrap', 'jquery', 'redux', 'nextjs', 'nuxtjs',
            
            // Databases
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
            
            // Cloud and DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd', 'terraform',
            
            // Tools and technologies
            'figma', 'sketch', 'photoshop', 'illustrator', 'jira', 'confluence', 'slack',
            'tableau', 'powerbi', 'excel', 'salesforce',
            
            // Methodologies
            'agile', 'scrum', 'kanban', 'devops', 'tdd', 'bdd',
            
            // Soft skills
            'leadership', 'teamwork', 'communication', 'project management', 'problem solving'
        ];

        const foundSkills = commonSkills.filter(skill => 
            description.includes(skill.toLowerCase())
        );

        return foundSkills;
    }

    extractExperienceLevel() {
        const description = this.extractJobDescription().toLowerCase();
        
        if (description.includes('senior') || description.includes('lead') || description.includes('principal')) {
            return 'Senior';
        } else if (description.includes('junior') || description.includes('entry') || description.includes('graduate')) {
            return 'Junior';
        } else if (description.includes('mid') || description.includes('intermediate')) {
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

        return 'Not specified';
    }

    extractJobType() {
        const description = this.extractJobDescription().toLowerCase();
        
        if (description.includes('remote')) return 'Remote';
        if (description.includes('hybrid')) return 'Hybrid';
        if (description.includes('on-site') || description.includes('onsite')) return 'On-site';
        
        return 'Not specified';
    }

    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // UI injection for job analysis
    resetJobAnalysisUI() {
        // Remove existing button if present
        this.removeJobAnalysisUI();
    }

    removeJobAnalysisUI() {
        const existingButton = document.getElementById('ai-resume-analysis-btn');
        if (existingButton) {
            existingButton.remove();
            console.log('Removed existing job analysis UI');
        }
    }

    injectJobAnalysisUI() {
        // Always inject a fresh button (after reset)

        const targetSelectors = [
            '.job-details-jobs-unified-top-card__primary-description-container',
            '.jobs-unified-top-card__primary-description',
            '.job-details-jobs-unified-top-card'
        ];

        let targetElement = null;
        for (const selector of targetSelectors) {
            targetElement = document.querySelector(selector);
            if (targetElement) break;
        }

        if (targetElement) {
            const analysisBtn = this.createAnalysisButton();
            targetElement.appendChild(analysisBtn);
        }
    }

    createAnalysisButton() {
        const button = document.createElement('div');
        button.id = 'ai-resume-analysis-btn';
        
        const buttonElement = document.createElement('div');
        buttonElement.style.cssText = `
            margin-top: 16px;
            padding: 12px 16px;
            background: #0073b1;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            text-align: center;
            transition: background-color 0.2s;
            font-size: 14px;
            user-select: none;
        `;
        buttonElement.textContent = '🤖 Customize Resume with AI';
        buttonElement.setAttribute('data-original-text', '🤖 Customize Resume with AI');
        
        // Add event listeners instead of inline handlers
        buttonElement.addEventListener('mouseover', () => {
            buttonElement.style.background = '#005885';
        });
        
        buttonElement.addEventListener('mouseout', () => {
            buttonElement.style.background = '#0073b1';
        });
        
        buttonElement.addEventListener('click', () => {
            this.triggerAIAnalysis();
        });

        button.appendChild(buttonElement);
        return button;
    }

    async triggerAIAnalysis() {
        try {
            const button = document.getElementById('ai-resume-analysis-btn');
            const buttonElement = button.querySelector('div');
            const originalText = buttonElement.getAttribute('data-original-text') || '🤖 Customize Resume with AI';
            
            button.innerHTML = `
                <div style="
                    margin-top: 16px;
                    padding: 12px 16px;
                    background: #666;
                    color: white;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                ">
                    ⏳ Analyzing job posting...
                </div>
            `;

            // Extract job data and send to extension
            console.log('Starting job data extraction...');
            const jobData = await this.extractJobData();
            console.log('Job data extracted:', jobData);
            
            // Validate job data
            if (!jobData.title || jobData.title === 'Job Title Not Found') {
                throw new Error('Could not extract job title. Please make sure you are on a LinkedIn job posting page.');
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
                    margin-top: 16px;
                    padding: 12px 16px;
                    background: #10b981;
                    color: white;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                ">
                    ✅ Job analyzed! Open extension popup to customize resume.
                </div>
            `;

            // Show notification
            this.showNotification('Job analyzed successfully! Click the extension icon to customize your resume.', 'success');

            setTimeout(() => {
                // Reset button to original state
                button.innerHTML = `
                    <div style="
                        margin-top: 16px;
                        padding: 12px 16px;
                        background: #0073b1;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        text-align: center;
                        transition: background-color 0.2s;
                        font-size: 14px;
                        user-select: none;
                    " data-original-text="${originalText}">
                        ${originalText}
                    </div>
                `;
                // Re-attach event listeners
                const newButtonElement = button.querySelector('div');
                newButtonElement.addEventListener('mouseover', () => {
                    newButtonElement.style.background = '#005885';
                });
                newButtonElement.addEventListener('mouseout', () => {
                    newButtonElement.style.background = '#0073b1';
                });
                newButtonElement.addEventListener('click', () => {
                    this.triggerAIAnalysis();
                });
            }, 5000);

        } catch (error) {
            console.error('Analysis error:', error);
            
            const button = document.getElementById('ai-resume-analysis-btn');
            button.innerHTML = `
                <div style="
                    margin-top: 16px;
                    padding: 12px 16px;
                    background: #ef4444;
                    color: white;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                ">
                    ❌ ${error.message || 'Analysis failed. Try again.'}
                </div>
            `;

            // Show error notification
            this.showNotification('Job analysis failed: ' + (error.message || 'Unknown error'), 'error');

            setTimeout(() => {
                // Reset button to original state after error
                button.innerHTML = `
                    <div style="
                        margin-top: 16px;
                        padding: 12px 16px;
                        background: #0073b1;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        text-align: center;
                        transition: background-color 0.2s;
                        font-size: 14px;
                        user-select: none;
                    " data-original-text="${originalText}">
                        ${originalText}
                    </div>
                `;
                // Re-attach event listeners
                const newButtonElement = button.querySelector('div');
                newButtonElement.addEventListener('mouseover', () => {
                    newButtonElement.style.background = '#005885';
                });
                newButtonElement.addEventListener('mouseout', () => {
                    newButtonElement.style.background = '#0073b1';
                });
                newButtonElement.addEventListener('click', () => {
                    this.triggerAIAnalysis();
                });
            }, 5000);
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.ai-resume-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `ai-resume-notification ${type}`;
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

    // Observe page changes (LinkedIn is a SPA)
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
                console.log('URL changed to:', lastUrl);
            }

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check for significant content changes
                    const hasJobContent = Array.from(mutation.addedNodes).some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            return node.className && (
                                node.className.includes('job-details') ||
                                node.className.includes('jobs-unified-top-card') ||
                                node.className.includes('job-view')
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
                console.log('Page change detected, re-detecting job page...');
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
            console.log('Popstate event detected');
            setTimeout(() => {
                this.detectJobPage();
            }, 500);
        });

        // Monitor for hash changes (LinkedIn sometimes uses hash routing)
        window.addEventListener('hashchange', () => {
            console.log('Hash change detected');
            setTimeout(() => {
                this.detectJobPage();
            }, 500);
        });
    }
}

// Initialize the extractor
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new LinkedInJobExtractor();
    });
} else {
    new LinkedInJobExtractor();
}