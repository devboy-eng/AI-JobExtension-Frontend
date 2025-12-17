// Content script for Naukri.com job page detection and data extraction
console.log('🚀 NAUKRI CONTENT SCRIPT LOADED!', window.location.href);

// SMART BUTTON INJECTION - Inside job description area
function injectButtonImmediately() {
    console.log('🚀 SMART BUTTON INJECTION ATTEMPT');
    
    // Remove any existing button first
    const existing = document.getElementById('ai-resume-analysis-btn-naukri');
    if (existing) existing.remove();
    
    // Target the "Job description" heading specifically
    const headingSelectors = [
        'h2:contains("Job description")',
        'h2:contains("job description")', 
        'h1:contains("Job description")',
        'h1:contains("job description")',
        'h3:contains("Job description")',
        'h3:contains("job description")'
    ];
    
    // Since CSS :contains() doesn't work in querySelectorAll, we'll find it manually
    let jobDescriptionHeading = null;
    
    // Find all h1, h2, h3 elements and check their text content
    const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const heading of allHeadings) {
        const text = heading.textContent.trim().toLowerCase();
        if (text === 'job description' || text.includes('job description')) {
            jobDescriptionHeading = heading;
            console.log('✅ Found "Job description" heading:', heading);
            break;
        }
    }
    
    // Fallback selectors for job description containers if heading not found
    const fallbackSelectors = [
        '.jobDescStyle',
        '.job-description', 
        '.jd-description',
        '.jobDesc',
        '.jdDet',
        '.job-details',
        '.job-desc'
    ];
    
    let targetContainer = null;
    let selectedSelector = '';
    
    // First try to use the Job Description heading
    if (jobDescriptionHeading) {
        targetContainer = jobDescriptionHeading;
        selectedSelector = 'Job description heading';
        console.log('✅ Using Job Description heading as target');
    } else {
        // Fallback to finding description containers
        for (const selector of fallbackSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`🔍 Checking fallback selector: ${selector} (found ${elements.length} elements)`);
            
            if (elements.length > 0) {
                for (const element of elements) {
                    const rect = element.getBoundingClientRect();
                    if (rect.height > 100 && rect.width > 300) {
                        targetContainer = element;
                        selectedSelector = selector;
                        console.log(`✅ Selected fallback container: ${selector}`);
                        break;
                    }
                }
                if (targetContainer) break;
            }
        }
    }
    
    const button = document.createElement('div');
    button.id = 'ai-resume-analysis-btn-naukri';
    button.innerHTML = '🤖 Customize Resume with AI';
    
    if (targetContainer) {
        if (selectedSelector === 'Job description heading') {
            // HEADING PLACEMENT - Next to the "Job description" h2 heading
            console.log('📍 Placing button next to Job Description heading');
            
            button.style.cssText = `
                background: #4285f4 !important;
                color: white !important;
                padding: 8px 16px !important;
                border-radius: 6px !important;
                box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3) !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                border: none !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                display: inline-block !important;
                text-align: center !important;
                transition: all 0.2s ease !important;
                min-width: 180px !important;
                max-width: 220px !important;
                margin-left: 20px !important;
                vertical-align: middle !important;
                white-space: nowrap !important;
            `;
            
            // Insert button right after the heading text, on the same line
            targetContainer.style.display = 'flex';
            targetContainer.style.alignItems = 'center';
            targetContainer.style.justifyContent = 'space-between';
            targetContainer.appendChild(button);
            
            console.log('✅ Button placed next to Job Description heading');
        } else {
            // FALLBACK PLACEMENT - Inside content area
            console.log('📍 Placing button in fallback content area');
            
            const buttonWrapper = document.createElement('div');
            buttonWrapper.style.cssText = `
                display: flex !important;
                justify-content: flex-end !important;
                margin: 10px 0 !important;
                padding: 0 !important;
            `;
            
            button.style.cssText = `
                background: #4285f4 !important;
                color: white !important;
                padding: 10px 16px !important;
                border-radius: 6px !important;
                box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3) !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                border: none !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                display: inline-block !important;
                text-align: center !important;
                transition: all 0.2s ease !important;
                min-width: 180px !important;
                max-width: 220px !important;
                white-space: nowrap !important;
            `;
            
            buttonWrapper.appendChild(button);
            
            if (targetContainer.firstChild) {
                targetContainer.insertBefore(buttonWrapper, targetContainer.firstChild);
            } else {
                targetContainer.appendChild(buttonWrapper);
            }
            
            console.log('✅ Button placed in fallback content area');
        }
    } else {
        // FALLBACK - Fixed position if no suitable container found
        console.log('🚨 No suitable container found, using fallback position');
        
        button.style.cssText = `
            position: fixed !important;
            top: 80px !important;
            right: 20px !important;
            z-index: 999999 !important;
            background: #4285f4 !important;
            color: white !important;
            padding: 12px 16px !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3) !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            min-width: 220px !important;
            text-align: center !important;
            font-family: Arial, sans-serif !important;
            display: block !important;
        `;
        
        document.body.appendChild(button);
        console.log('⚠️ Button placed in fallback fixed position');
    }
    
    // Add hover effects
    button.addEventListener('mouseover', () => {
        button.style.background = '#3367d6';
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.4)';
    });
    
    button.addEventListener('mouseout', () => {
        button.style.background = '#4285f4';
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 2px 8px rgba(66, 133, 244, 0.3)';
    });
    
    button.onclick = () => {
        console.log('🎯 Naukri AI analysis triggered!');
        
        // Get the extractor instance and trigger analysis
        if (window.naukriExtractor) {
            window.naukriExtractor.triggerAIAnalysis();
        } else {
            console.error('Naukri extractor not available');
            alert('Please wait for the page to fully load and try again.');
        }
    };
    
    // Add debug helper to inspect page structure
    window.inspectNaukriPage = () => {
        console.log('🔍 NAUKRI PAGE STRUCTURE INSPECTION');
        
        // Find all potential containers
        const allContainers = document.querySelectorAll('div, section');
        const candidates = [];
        
        allContainers.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            const className = el.className;
            const innerHTML = el.innerHTML;
            
            if (rect.height > 200 && rect.width > 300 && innerHTML.length > 200) {
                const isHeader = className.toLowerCase().includes('header') || 
                               className.toLowerCase().includes('title');
                const hasJobContent = innerHTML.toLowerCase().includes('responsibility') ||
                                    innerHTML.toLowerCase().includes('requirement') ||
                                    innerHTML.toLowerCase().includes('experience');
                
                candidates.push({
                    index,
                    className: className,
                    dimensions: `${rect.width}x${rect.height}`,
                    isHeader,
                    hasJobContent,
                    textLength: innerHTML.length,
                    element: el
                });
            }
        });
        
        console.table(candidates);
        console.log('Use candidates[X].element to inspect specific containers');
        window.naukriCandidates = candidates;
    };
    
    // Add debug helper to find company name elements
    window.debugNaukriCompany = () => {
        console.log('🏢 NAUKRI COMPANY NAME DEBUGGING');
        
        const allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, span, div, a, p');
        const companyClues = [];
        
        allElements.forEach((el, index) => {
            const text = el.textContent?.trim();
            if (text && text.length > 2 && text.length < 100) {
                const hasCompanyKeywords = /\b(?:Inc|Ltd|LLC|Corp|Company|Corporation|Technologies|Systems|Solutions|Services|Group|Limited|Pvt\.?\s*Ltd\.?)\b/i.test(text);
                const isCapitalized = /^[A-Z]/.test(text);
                const className = el.className;
                const tagName = el.tagName.toLowerCase();
                
                if (hasCompanyKeywords || (isCapitalized && !text.toLowerCase().includes('job'))) {
                    companyClues.push({
                        index,
                        text: text.substring(0, 60),
                        tagName,
                        className: className.substring(0, 50),
                        hasCompanyKeywords,
                        isCapitalized,
                        element: el
                    });
                }
            }
        });
        
        console.table(companyClues);
        console.log('Use window.naukriCompanyCandidates[X].element to inspect elements');
        window.naukriCompanyCandidates = companyClues;
    };
    
    console.log('✅ Button injection completed');
    console.log('💡 Debug: Use window.inspectNaukriPage() to analyze page structure');
    console.log('💡 Debug: Use window.debugNaukriCompany() to find company name elements');
}

// Try injection immediately
injectButtonImmediately();

// Try again after short delay
setTimeout(injectButtonImmediately, 500);
setTimeout(injectButtonImmediately, 1000);
setTimeout(injectButtonImmediately, 2000);

class NaukriJobExtractor {
    constructor() {
        console.log('🏗️ NaukriJobExtractor constructor called');
        // Force inject button again from constructor
        setTimeout(injectButtonImmediately, 100);
        this.init();
    }

    init() {
        console.log('🚀 Initializing Naukri Job Extractor');
        console.log('Current URL:', window.location.href);
        console.log('Document ready state:', document.readyState);
        
        this.setupMessageListener();
        
        // Make extractor available globally for the immediate button
        window.naukriExtractor = this;
        console.log('✅ Naukri extractor made available globally');
        
        // Set up ongoing monitoring for page changes
        this.observePageChanges();
        
        // Add debug helpers
        window.forceNaukriUI = () => {
            console.log('🔧 Force injecting additional Naukri UI...');
            injectButtonImmediately();
        };
        console.log('💡 Debug: Use window.forceNaukriUI() to force inject UI');
        console.log('💡 Debug: Use window.naukriExtractor.triggerAIAnalysis() to test analysis');
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'extractJobData') {
                // Only respond if we're on a Naukri page
                if (this.isNaukriJobPage()) {
                    this.extractJobData()
                        .then(jobData => sendResponse({ jobData }))
                        .catch(error => sendResponse({ error: error.message }));
                    return true; // Keep message channel open for async response
                }
                // Don't respond if not on Naukri - let other content scripts handle it
            }
        });
    }

    detectJobPage() {
        const isJobPage = this.isNaukriJobPage();
        console.log('🔍 Naukri page detection result:', {
            isJobPage: isJobPage,
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
        
        if (isJobPage) {
            console.log('✅ Naukri job page detected - injecting UI');
            // Always reset UI when detecting a new job page
            this.resetJobAnalysisUI();
            
            // Wait a bit for the page to fully load
            setTimeout(() => {
                this.injectJobAnalysisUI();
            }, 1000);
        } else {
            console.log('❌ Not a Naukri job page - removing UI');
            // Remove UI if not on a job page
            this.removeJobAnalysisUI();
        }
    }

    isNaukriJobPage() {
        const url = window.location.href;
        const pathname = window.location.pathname;
        
        const isNaukriDomain = url.includes('naukri.com');
        const hasJobListings = url.includes('job-listings') || pathname.includes('job-listings');
        const hasJobDetail = url.includes('jobdetail') || pathname.includes('jobdetail');
        const hasJobInPath = pathname.includes('job');
        
        // Check for common Naukri job URL patterns
        const jobPatterns = [
            /job-listings-/i,
            /jobdetail-/i,
            /\/jobs\//i,
            /\/job\//i
        ];
        
        const matchesPattern = jobPatterns.some(pattern => pattern.test(url));
        
        const isJobPage = hasJobListings || hasJobDetail || hasJobInPath || matchesPattern;
        
        console.log('🔍 Comprehensive Naukri Job Page Check:', {
            url: url,
            pathname: pathname,
            isNaukriDomain: isNaukriDomain,
            hasJobListings: hasJobListings,
            hasJobDetail: hasJobDetail,
            hasJobInPath: hasJobInPath,
            matchesPattern: matchesPattern,
            isJobPage: isJobPage,
            result: isNaukriDomain && isJobPage
        });
        
        // Return result based on domain and job page patterns
        const result = isNaukriDomain && isJobPage;
        
        if (result) {
            console.log('✅ Confirmed Naukri job page');
        } else if (isNaukriDomain) {
            console.log('ℹ️ On Naukri domain but not a job page');
        }
        
        return result;
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
        
        // Naukri job title selectors (updated for current layout)
        const selectors = [
            // Primary Naukri selectors
            '.jd-header-title',
            '.jobTitle',
            '.job-title',
            'h1[class*="title"]',
            '.title',
            'h1.jobTitle',
            '.jd-header h1',
            '.job-header h1',
            '[data-qa="job-title"]',
            '.job-post-name',
            
            // Additional modern Naukri selectors
            '.job-tuple-title',
            '.job-desc-header h1',
            '.job-details-title',
            '.jdp-title',
            '.job-description h1',
            'h1[class*="jd"]',
            'h1[class*="job"]',
            
            // Fallback selectors
            'h1',
            'h2[class*="title"]',
            'h2[class*="job"]'
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
            // Modern Naukri company selectors (2024)
            '.jd-header-comp-name',
            '.companyName',
            '.company-name',
            '.comp-name', 
            '.jd-comp-name',
            '.company',
            '.employer-name',
            '.hiring-company',
            
            // Data attributes
            '[data-qa="company-name"]',
            '[data-testid="company-name"]',
            
            // Link-based selectors
            'a[title*="company"]',
            'a[href*="company"]',
            'a[class*="company"]',
            
            // Generic selectors that might contain company info
            '.job-company',
            '.job-employer',
            '.company-info',
            '.employer',
            '.org-name',
            '.organization',
            
            // Broader patterns for modern layouts
            'span[class*="company"]',
            'div[class*="company"]',
            'p[class*="company"]',
            'h2[class*="company"]',
            'h3[class*="company"]'
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

        // Enhanced fallback: Look for company names near job titles or in header areas
        console.log('  🔄 Trying enhanced company name detection...');
        
        // Look for elements that might contain company info in job headers
        const potentialCompanyElements = document.querySelectorAll('h1, h2, h3, h4, span, div, a, p');
        const companyPatterns = [
            /\b(?:Inc|Ltd|LLC|Corp|Company|Corporation|Technologies|Systems|Solutions|Services|Group|Limited)\b/i,
            /\b(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|Pvt\s+Ltd)\b/i
        ];
        
        for (const element of potentialCompanyElements) {
            if (element && element.textContent) {
                const text = this.cleanText(element.textContent);
                
                // Skip very long text (likely descriptions) and very short text
                if (text.length > 3 && text.length < 100) {
                    // Check if text matches company patterns
                    const matchesPattern = companyPatterns.some(pattern => pattern.test(text));
                    
                    if (matchesPattern && this.isValidCompanyName(text)) {
                        console.log(`  ✅ Found company by pattern: "${text}"`);
                        return text;
                    }
                    
                    // Check if it's a likely company name (capitalized, reasonable length)
                    const isCapitalized = /^[A-Z]/.test(text);
                    const hasSpaces = text.includes(' ');
                    const isReasonableLength = text.length >= 3 && text.length <= 50;
                    const hasNoCommonJobWords = !text.toLowerCase().match(/\b(job|position|role|vacancy|opening|career|work|employment|hiring)\b/);
                    
                    if (isCapitalized && isReasonableLength && hasNoCommonJobWords && this.isValidCompanyName(text)) {
                        // Double-check it's not part of a longer job description
                        const parentText = element.parentNode?.textContent || '';
                        const isPartOfLongText = parentText.length > 200;
                        
                        if (!isPartOfLongText) {
                            console.log(`  ✅ Found likely company name: "${text}"`);
                            return text;
                        }
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
        const comprehensiveSkills = [
            // Programming Languages
            'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust', 'swift', 'kotlin',
            'typescript', 'scala', 'r', 'matlab', 'sql', 'html', 'css', 'dart', 'perl', 'vb.net', 'cobol',
            'fortran', 'assembly', 'lua', 'haskell', 'clojure', 'erlang', 'elixir', 'f#', 'groovy',
            
            // Web Frameworks & Libraries
            'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
            'rails', 'bootstrap', 'jquery', 'redux', 'nextjs', 'nuxtjs', 'react native', 'flutter',
            'svelte', 'ember', 'backbone', 'meteor', 'nestjs', 'fastapi', 'strapi', 'gatsby',
            
            // Mobile Development
            'ios', 'android', 'react native', 'flutter', 'xamarin', 'ionic', 'cordova', 'phonegap',
            'swift', 'objective-c', 'kotlin', 'java', 'flutter', 'dart',
            
            // Databases & Data Storage
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite', 'cassandra',
            'dynamodb', 'firebase', 'couchdb', 'neo4j', 'influxdb', 'mariadb', 'snowflake', 'bigquery',
            'databricks', 'clickhouse', 'aurora', 'cosmos db', 'amazon rds',
            
            // Cloud Platforms & Services
            'aws', 'azure', 'gcp', 'google cloud', 'amazon web services', 'microsoft azure', 'digital ocean',
            'heroku', 'linode', 'vultr', 'alibaba cloud', 'ibm cloud', 'oracle cloud',
            'lambda', 'ec2', 's3', 'cloudfront', 'route 53', 'cloudformation', 'cloudwatch',
            
            // DevOps & CI/CD
            'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd', 'terraform', 'ansible', 'puppet', 'chef',
            'gitlab', 'github actions', 'circleci', 'travis ci', 'bamboo', 'teamcity', 'helm', 'istio',
            'prometheus', 'grafana', 'elk stack', 'nagios', 'zabbix', 'datadog', 'new relic',
            
            // Testing & QA
            'selenium', 'junit', 'testng', 'cypress', 'jest', 'mocha', 'postman', 'rest assured',
            'cucumber', 'jasmine', 'karma', 'protractor', 'appium', 'robot framework', 'playwright',
            'load testing', 'performance testing', 'automation testing', 'manual testing',
            
            // Design & UX/UI
            'figma', 'sketch', 'photoshop', 'illustrator', 'adobe xd', 'invision', 'zeplin', 'principle',
            'framer', 'canva', 'ui/ux design', 'user experience', 'user interface', 'prototyping',
            'wireframing', 'design systems', 'responsive design', 'accessibility',
            
            // Project Management & Collaboration
            'jira', 'confluence', 'slack', 'trello', 'asana', 'monday.com', 'notion', 'basecamp',
            'microsoft project', 'smartsheet', 'clickup', 'linear', 'github', 'bitbucket',
            
            // Business Intelligence & Analytics
            'tableau', 'powerbi', 'qlik', 'looker', 'excel', 'google analytics', 'mixpanel', 'amplitude',
            'segment', 'hotjar', 'crazy egg', 'adobe analytics', 'splunk', 'kibana',
            
            // Enterprise Software
            'salesforce', 'sap', 'oracle erp', 'microsoft dynamics', 'workday', 'servicenow',
            'atlassian', 'hubspot', 'zendesk', 'freshworks', 'zoho', 'netsuite',
            
            // Data Science & ML/AI
            'machine learning', 'deep learning', 'artificial intelligence', 'data science', 'nlp',
            'computer vision', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
            'matplotlib', 'seaborn', 'jupyter', 'apache spark', 'hadoop', 'kafka', 'airflow',
            'mlflow', 'kubeflow', 'dataiku', 'alteryx', 'sas', 'spss', 'stata',
            
            // Security & Cybersecurity
            'cybersecurity', 'information security', 'network security', 'penetration testing',
            'vulnerability assessment', 'security auditing', 'encryption', 'firewall', 'vpn',
            'siem', 'soc', 'incident response', 'malware analysis', 'forensics', 'compliance',
            'iso 27001', 'nist', 'gdpr', 'hipaa', 'sox', 'pci dss',
            
            // Blockchain & Cryptocurrency
            'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'smart contracts', 'solidity',
            'web3', 'defi', 'nft', 'hyperledger', 'chaincode', 'truffle', 'metamask',
            
            // Industry-Specific Technologies
            // Finance & Fintech
            'fintech', 'banking', 'payments', 'forex', 'trading', 'risk management', 'compliance',
            'kyc', 'aml', 'swift', 'sepa', 'iso 20022', 'fix protocol', 'bloomberg terminal',
            'reuters', 'murex', 'calypso', 'summit', 'kondor', 'treasury', 'capital markets',
            
            // Healthcare & Life Sciences
            'healthcare', 'medical devices', 'ehr', 'emr', 'fhir', 'hl7', 'dicom', 'clinical trials',
            'pharmaceutical', 'biotech', 'regulatory affairs', 'fda', 'gmp', 'gcp', 'clinical data management',
            'pharmacovigilance', 'medical affairs', 'drug discovery', 'bioinformatics',
            
            // E-commerce & Retail
            'e-commerce', 'retail', 'pos', 'inventory management', 'supply chain', 'logistics',
            'wms', 'erp', 'crm', 'magento', 'shopify', 'woocommerce', 'prestashop',
            'payment gateways', 'fraud detection', 'recommendation engines',
            
            // Manufacturing & Industrial
            'manufacturing', 'industrial automation', 'plc', 'scada', 'mes', 'erp', 'lean manufacturing',
            'six sigma', 'quality control', 'iso 9001', 'kaizen', 'just in time', 'supply chain',
            'predictive maintenance', 'iiot', 'industry 4.0',
            
            // Education & EdTech
            'education', 'edtech', 'e-learning', 'lms', 'moodle', 'blackboard', 'canvas',
            'instructional design', 'curriculum development', 'assessment', 'gamification',
            
            // Media & Entertainment
            'media', 'entertainment', 'streaming', 'content management', 'digital marketing',
            'social media', 'seo', 'sem', 'content creation', 'video editing', 'audio editing',
            'broadcast', 'ott platforms', 'cdn',
            
            // Telecommunications
            'telecommunications', 'telecom', 'network engineering', '5g', '4g', 'lte', 'voip',
            'sip', 'ims', 'bss', 'oss', 'network optimization', 'rf engineering',
            
            // Energy & Utilities
            'energy', 'utilities', 'renewable energy', 'smart grid', 'scada', 'power systems',
            'electrical engineering', 'oil and gas', 'mining', 'environmental monitoring',
            
            // Transportation & Logistics
            'transportation', 'logistics', 'fleet management', 'route optimization', 'gps tracking',
            'telematics', 'warehouse management', 'tms', 'automotive', 'aerospace',
            
            // Real Estate & PropTech
            'real estate', 'proptech', 'property management', 'facility management', 'construction',
            'bim', 'cad', 'architecture', 'urban planning', 'smart buildings',
            
            // Methodologies & Frameworks
            'agile', 'scrum', 'kanban', 'devops', 'tdd', 'bdd', 'waterfall', 'lean', 'six sigma',
            'itil', 'prince2', 'pmbok', 'safe', 'less', 'extreme programming', 'feature driven development',
            
            // Soft Skills & Professional Skills
            'leadership', 'teamwork', 'communication', 'project management', 'problem solving',
            'analytical thinking', 'time management', 'strategic planning', 'stakeholder management',
            'change management', 'risk management', 'vendor management', 'budget management',
            'team building', 'mentoring', 'coaching', 'public speaking', 'presentation skills',
            'negotiation', 'conflict resolution', 'decision making', 'critical thinking',
            'innovation', 'creativity', 'adaptability', 'emotional intelligence', 'cultural awareness',
            
            // Certifications & Standards
            'pmp', 'csm', 'psm', 'aws certified', 'azure certified', 'gcp certified', 'cissp', 'cisa',
            'cism', 'comptia', 'cisco certified', 'microsoft certified', 'oracle certified',
            'salesforce certified', 'scrum master', 'product owner', 'itil certified'
        ];

        // Enhanced skill detection with fuzzy matching
        const foundSkills = [];
        
        comprehensiveSkills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            
            // Direct match
            if (description.includes(skillLower)) {
                foundSkills.push(skill);
                return;
            }
            
            // Handle variations and common abbreviations
            const variations = this.getSkillVariations(skill);
            for (const variation of variations) {
                if (description.includes(variation.toLowerCase())) {
                    foundSkills.push(skill);
                    break;
                }
            }
        });

        // Remove duplicates and return
        return [...new Set(foundSkills)];
    }

    getSkillVariations(skill) {
        const variations = [skill];
        
        // Add common variations
        const skillVariations = {
            'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2020'],
            'typescript': ['ts'],
            'python': ['py', 'python3'],
            'c#': ['csharp', 'c sharp', '.net', 'dotnet'],
            'c++': ['cpp', 'cplusplus'],
            'node.js': ['nodejs', 'node js'],
            'react native': ['reactnative', 'react-native'],
            'postgresql': ['postgres', 'psql'],
            'mongodb': ['mongo'],
            'elasticsearch': ['elastic search', 'elk'],
            'amazon web services': ['aws'],
            'google cloud': ['gcp', 'google cloud platform'],
            'microsoft azure': ['azure'],
            'artificial intelligence': ['ai'],
            'machine learning': ['ml'],
            'natural language processing': ['nlp'],
            'user interface': ['ui'],
            'user experience': ['ux'],
            'search engine optimization': ['seo'],
            'search engine marketing': ['sem'],
            'application programming interface': ['api'],
            'software development kit': ['sdk'],
            'continuous integration': ['ci'],
            'continuous deployment': ['cd'],
            'continuous delivery': ['cd']
        };
        
        if (skillVariations[skill.toLowerCase()]) {
            variations.push(...skillVariations[skill.toLowerCase()]);
        }
        
        return variations;
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
        // Enhanced target elements for modern Naukri layout
        const targetSelectors = [
            // Modern Naukri selectors (2024)
            '.jd-header',
            '.job-header',
            '.jd-header-details',
            '.job-detail-header',
            '.jd-header-title',
            '.jobTitle',
            '.job-title',
            '.title',
            
            // Alternative modern selectors
            '.job-tuple-container',
            '.job-desc-header',
            '.job-details-container',
            '.jdp-header',
            '.job-posting-header',
            
            // Generic fallbacks
            'h1[class*="title"]',
            'h1[class*="job"]',
            'div[class*="header"]',
            'section[class*="job"]',
            
            // Last resort - insert at top of body
            'body'
        ];

        console.log('🎯 Attempting to inject Naukri UI...');
        console.log('Available DOM elements:', {
            h1Count: document.querySelectorAll('h1').length,
            titleElements: document.querySelectorAll('[class*="title"]').length,
            headerElements: document.querySelectorAll('[class*="header"]').length,
            jobElements: document.querySelectorAll('[class*="job"]').length
        });

        let targetElement = null;
        let selectedSelector = '';
        
        for (const selector of targetSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`  Checking selector: ${selector} (found ${elements.length} elements)`);
            
            if (elements.length > 0) {
                // Take the first visible element
                for (const element of elements) {
                    const rect = element.getBoundingClientRect();
                    if (rect.height > 0 && rect.width > 0) {
                        targetElement = element;
                        selectedSelector = selector;
                        console.log(`  ✅ Selected: ${selector}`, {
                            tagName: element.tagName,
                            className: element.className,
                            textContent: element.textContent.substring(0, 100)
                        });
                        break;
                    }
                }
                if (targetElement) break;
            }
        }

        if (targetElement) {
            const analysisBtn = this.createAnalysisButton();
            
            // Smart insertion logic based on element type
            if (selectedSelector === 'body') {
                // Insert at top of page for body fallback
                targetElement.insertBefore(analysisBtn, targetElement.firstChild);
            } else {
                // Insert after the target element
                targetElement.parentNode.insertBefore(analysisBtn, targetElement.nextSibling);
            }
            
            console.log(`🎉 Successfully injected Naukri UI using selector: ${selectedSelector}`);
        } else {
            console.error('❌ No suitable target element found for Naukri UI injection');
            console.log('DOM structure sample:', document.body.innerHTML.substring(0, 500));
            
            // Emergency fallback - insert at beginning of body
            console.log('🚨 Using emergency fallback injection');
            const analysisBtn = this.createAnalysisButton();
            // Ensure emergency button is visible
            analysisBtn.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                z-index: 999999 !important;
                background: #4285f4 !important;
                color: white !important;
                padding: 12px !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                font-size: 14px !important;
                cursor: pointer !important;
                min-width: 200px !important;
                text-align: center !important;
            `;
            document.body.appendChild(analysisBtn);
        }
    }

    createAnalysisButton() {
        console.log('🎨 Creating Naukri analysis button...');
        const button = document.createElement('div');
        button.id = 'ai-resume-analysis-btn-naukri';
        button.textContent = '🤖 Customize Resume with AI';
        
        // Set inline styles to ensure visibility
        button.style.cssText = `
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
            z-index: 1000;
            display: block !important;
        `;
        
        // Add event listeners
        button.addEventListener('mouseover', () => {
            button.style.background = '#3367d6';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.background = '#4285f4';
        });
        
        button.addEventListener('click', () => {
            console.log('🎯 Naukri button clicked!');
            this.triggerAIAnalysis();
        });

        console.log('✅ Naukri button created successfully');
        return button;
    }

    async triggerAIAnalysis() {
        try {
            const button = document.getElementById('ai-resume-analysis-btn-naukri');
            if (!button) {
                throw new Error('Button not found');
            }
            
            const originalText = button.textContent || '🤖 Customize Resume with AI';
            
            // Update button to loading state
            const originalStyle = button.style.cssText;
            button.style.background = '#666';
            button.textContent = '⏳ Analyzing Naukri job posting...';

            // Extract job data and send to extension
            console.log('Starting Naukri job data extraction...');
            const jobData = await this.extractJobData();
            console.log('Naukri job data extracted:', jobData);
            
            // Validate job data with enhanced debugging
            console.log('🔍 Validating extracted job data:', {
                title: jobData.title,
                titleLength: jobData.title?.length,
                description: jobData.description?.substring(0, 100) + '...',
                descriptionLength: jobData.description?.length,
                company: jobData.company,
                platform: jobData.platform
            });
            
            if (!jobData.title || jobData.title === 'Job Title Not Found') {
                console.error('❌ Job title extraction failed');
                throw new Error('Could not extract job title from this Naukri page. The page structure might have changed or still be loading.');
            }

            if (!jobData.description || jobData.description === 'Job description not found') {
                console.error('❌ Job description extraction failed');
                throw new Error('Could not extract job description from this Naukri page. Please wait for the page to fully load and try again.');
            }

            // Send message to background script to trigger popup analysis
            const response = await chrome.runtime.sendMessage({
                action: 'jobAnalyzed',
                jobData: jobData
            });

            console.log('Message sent to background script, response:', response);

            // Show success state
            button.style.background = '#10b981';
            button.textContent = '✅ Job analyzed! Open extension popup.';

            // Show notification
            this.showNotification('Naukri job analyzed successfully! Click the extension icon to customize your resume.', 'success');

            setTimeout(() => {
                // Reset button to original state
                button.style.cssText = originalStyle;
                button.textContent = originalText;
                
                // Re-attach event listeners
                button.addEventListener('mouseover', () => {
                    button.style.background = '#3367d6';
                });
                button.addEventListener('mouseout', () => {
                    button.style.background = '#4285f4';
                });
                button.addEventListener('click', () => {
                    this.triggerAIAnalysis();
                });
            }, 5000);

        } catch (error) {
            console.error('Naukri analysis error:', error);
            
            const button = document.getElementById('ai-resume-analysis-btn-naukri');
            if (button) {
                button.style.background = '#ef4444';
                button.textContent = `❌ ${error.message || 'Analysis failed. Try again.'}`;
            }

            // Show error notification
            this.showNotification('Naukri job analysis failed: ' + (error.message || 'Unknown error'), 'error');

            setTimeout(() => {
                // Reset button to original state after error
                if (button) {
                    const originalText = '🤖 Customize Resume with AI';
                    button.style.background = '#4285f4';
                    button.textContent = originalText;
                    
                    // Re-attach event listeners
                    button.addEventListener('mouseover', () => {
                        button.style.background = '#3367d6';
                    });
                    button.addEventListener('mouseout', () => {
                        button.style.background = '#4285f4';
                    });
                    button.addEventListener('click', () => {
                        this.triggerAIAnalysis();
                    });
                }
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