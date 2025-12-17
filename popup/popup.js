// Popup JavaScript functionality
class ResumeCustomizer {
    constructor() {
        this.currentTab = 'auth';
        this.workExperiences = [];
        this.certificates = [];
        this.currentUser = null;
        this.authToken = null;
        this.init();
    }

    init() {
        this.detectEnvironment();
        this.setupEventListeners();
        this.checkAuthStatus();
        // Don't load data here - will be loaded after authentication check
        this.checkJobPlatformStatus();
    }

    detectEnvironment() {
        // Detect if running in Electron vs Browser
        const isElectron = window.electronAPI && window.electronAPI.isElectron;
        
        if (!isElectron) {
            // Running in browser - apply browser-specific styles
            document.body.classList.add('browser-mode');
            
            // Override desktop styles for browser
            const style = document.createElement('style');
            style.innerHTML = `
                body.browser-mode {
                    min-height: 600px !important;
                    max-height: 600px !important;
                    height: 600px !important;
                    border-radius: 12px !important;
                    box-shadow: none !important;
                    overflow: hidden !important;
                }
                body.browser-mode .container {
                    height: 600px !important;
                    max-height: 600px !important;
                    min-height: 600px !important;
                }
            `;
            document.head.appendChild(style);
        } else {
            document.body.classList.add('electron-mode');
        }
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Profile form
        document.getElementById('saveProfile').addEventListener('click', () => this.saveProfile());
        document.getElementById('addExperience').addEventListener('click', () => this.addWorkExperience());
        document.getElementById('addCertificate').addEventListener('click', () => this.addCertificate());

        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('resumeFile');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        document.getElementById('removeFile').addEventListener('click', () => this.removeUploadedFile());
        document.getElementById('parseResume').addEventListener('click', () => this.parseResume());

        // Reference CV upload
        document.getElementById('uploadReference').addEventListener('click', () => {
            document.getElementById('referenceFile').click();
        });
        document.getElementById('referenceFile').addEventListener('change', (e) => this.handleReferenceUpload(e));

        // Job analysis
        document.getElementById('analyzeJob').addEventListener('click', () => this.analyzeJobAndCustomize());

        // Download buttons
        document.getElementById('downloadPDF').addEventListener('click', () => this.downloadResume('pdf'));
        document.getElementById('downloadDOC').addEventListener('click', () => this.downloadResume('doc'));
        document.getElementById('editResume').addEventListener('click', () => this.editResume());

        // Version management
        document.getElementById('createVersion').addEventListener('click', () => this.createNewVersion());

        // Version history modal
        document.getElementById('versionBtn').addEventListener('click', () => this.showVersionModal());
        document.getElementById('closeVersionModal').addEventListener('click', () => this.hideVersionModal());

        // Customization history modal
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistoryModal());
        document.getElementById('closeHistoryModal').addEventListener('click', () => this.hideHistoryModal());


        // Authentication event listeners
        this.setupAuthEventListeners();

        // Coin recharge event listeners
        this.setupCoinEventListeners();

        // Auto-save on input changes
        this.setupAutoSave();
    }

    switchTab(tabName) {
        // Check authentication for protected tabs
        const protectedTabs = ['profile', 'resume', 'customize', 'versions'];
        
        if (protectedTabs.includes(tabName) && !this.isAuthenticated()) {
            this.showAuthMessage('Please log in to access this feature', 'error');
            this.switchTab('auth');
            return;
        }

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        this.currentTab = tabName;
        
        // Update tab accessibility based on auth status
        this.updateTabAccessibility();
    }

    async loadData() {
        try {
            const data = await chrome.storage.local.get([
                'profile', 'workExperiences', 'certificates', 'uploadedResume', 'referenceCV', 'resumeVersions'
            ]);

            if (data.profile) {
                this.loadProfile(data.profile);
            }

            if (data.workExperiences) {
                this.workExperiences = data.workExperiences;
                this.renderWorkExperiences();
            }

            if (data.certificates) {
                this.certificates = data.certificates;
                this.renderCertificates();
            }

            if (data.uploadedResume) {
                this.showUploadedFile(data.uploadedResume);
            }

            if (data.resumeVersions) {
                this.renderResumeVersions(data.resumeVersions);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    loadProfile(profile) {
        Object.keys(profile).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = profile[key];
            }
        });
    }

    async saveProfile() {
        // Check authentication first
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to save profile', 'error');
            this.switchTab('auth');
            return;
        }
        
        const profileData = {
            ...this.getProfileData(),
            workExperience: this.workExperiences,
            certificates: this.certificates
        };
        
        try {
            // Save to backend
            const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/profile', {
                method: 'POST',
                body: JSON.stringify(profileData)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.showNotification('Profile saved successfully!', 'success');
                } else {
                    this.showNotification('Error saving profile to server', 'error');
                }
            } else {
                this.showNotification('Error saving profile to server', 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error saving profile', 'error');
        }
    }

    getProfileData() {
        return {
            name: document.getElementById('name').value,
            designation: document.getElementById('designation').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            linkedin: document.getElementById('linkedin').value,
            skills: document.getElementById('skills').value,
            education: document.getElementById('education').value,
            languages: document.getElementById('languages').value
        };
    }

    addWorkExperience(experience = {}) {
        // Check authentication first
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to manage work experience', 'error');
            this.switchTab('auth');
            return;
        }
        const id = Date.now().toString();
        const newExperience = {
            id,
            designation: experience.designation || '',
            company: experience.company || '',
            startDate: experience.startDate || '',
            endDate: experience.endDate || '',
            current: experience.current || false,
            description: experience.description || ''
        };

        this.workExperiences.push(newExperience);
        this.renderWorkExperiences();
    }

    removeWorkExperience(id) {
        this.workExperiences = this.workExperiences.filter(exp => exp.id !== id);
        this.renderWorkExperiences();
    }

    moveWorkExperience(id, direction) {
        const currentIndex = this.workExperiences.findIndex(exp => exp.id === id);
        
        if (currentIndex === -1) return;
        
        let newIndex;
        if (direction === 'up') {
            newIndex = Math.max(0, currentIndex - 1);
        } else if (direction === 'down') {
            newIndex = Math.min(this.workExperiences.length - 1, currentIndex + 1);
        }
        
        // Don't move if already at the boundary
        if (newIndex === currentIndex) return;
        
        // Swap the items
        const itemToMove = this.workExperiences[currentIndex];
        this.workExperiences.splice(currentIndex, 1);
        this.workExperiences.splice(newIndex, 0, itemToMove);
        
        // Re-render the work experiences
        this.renderWorkExperiences();
        
        // Auto-save the changes
        this.saveDataToStorage();
    }

    async saveDataToStorage() {
        try {
            await chrome.storage.local.set({ 
                workExperiences: this.workExperiences,
                certificates: this.certificates
            });
        } catch (error) {
            console.error('Error saving data to storage:', error);
        }
    }

    renderWorkExperiences() {
        const container = document.getElementById('workExperiences');
        container.innerHTML = '';

        this.workExperiences.forEach((experience, index) => {
            const experienceEl = this.createWorkExperienceElement(experience, index, this.workExperiences.length);
            container.appendChild(experienceEl);
        });
    }

    createWorkExperienceElement(experience, index, totalCount) {
        const div = document.createElement('div');
        div.className = 'work-experience';
        div.innerHTML = `
            <div class="experience-header">
                <div class="experience-title">${experience.designation ? `${experience.company || 'Company'} - ${experience.designation}` : 'New Experience'}</div>
                <div class="experience-controls">
                    <button class="move-up" data-exp-id="${experience.id}" title="Move up" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="move-down" data-exp-id="${experience.id}" title="Move down" ${index === totalCount - 1 ? 'disabled' : ''}>↓</button>
                    <button class="remove-experience" data-exp-id="${experience.id}" title="Remove">×</button>
                </div>
            </div>
            <div class="form">
                <div class="form-group">
                    <label>Designation</label>
                    <input type="text" value="${experience.designation}" 
                           data-field="designation" data-exp-id="${experience.id}">
                </div>
                <div class="form-group">
                    <label>Company Name</label>
                    <input type="text" value="${experience.company}" 
                           data-field="company" data-exp-id="${experience.id}">
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="month" value="${experience.startDate}" 
                           data-field="startDate" data-exp-id="${experience.id}">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="month" value="${experience.endDate}" 
                           data-field="endDate" data-exp-id="${experience.id}"
                           ${experience.current ? 'disabled' : ''}>
                    <label style="font-size: 12px; margin-top: 4px;">
                        <input type="checkbox" ${experience.current ? 'checked' : ''} 
                               data-field="current" data-exp-id="${experience.id}"> 
                        Currently working here
                    </label>
                </div>
                <div class="form-group">
                    <label>Job Description</label>
                    <textarea data-field="description" data-exp-id="${experience.id}">${experience.description}</textarea>
                </div>
            </div>
        `;
        
        // Add event listeners for control buttons
        const removeBtn = div.querySelector('.remove-experience');
        const moveUpBtn = div.querySelector('.move-up');
        const moveDownBtn = div.querySelector('.move-down');
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeWorkExperience(experience.id);
            });
        }
        
        if (moveUpBtn) {
            moveUpBtn.addEventListener('click', () => {
                this.moveWorkExperience(experience.id, 'up');
            });
        }
        
        if (moveDownBtn) {
            moveDownBtn.addEventListener('click', () => {
                this.moveWorkExperience(experience.id, 'down');
            });
        }
        
        // Add event listeners for all form fields
        const inputs = div.querySelectorAll('input[data-exp-id], textarea[data-exp-id]');
        inputs.forEach(input => {
            const field = input.dataset.field;
            const expId = input.dataset.expId;
            
            if (field === 'current') {
                input.addEventListener('change', (e) => {
                    this.toggleCurrentJob(expId, e.target.checked);
                });
            } else {
                input.addEventListener('change', (e) => {
                    this.updateWorkExperience(expId, field, e.target.value);
                });
            }
        });
        
        return div;
    }

    updateWorkExperience(id, field, value) {
        const experience = this.workExperiences.find(exp => exp.id === id);
        if (experience) {
            experience[field] = value;
            if (field === 'designation') {
                this.renderWorkExperiences();
            }
        }
    }

    toggleCurrentJob(id, isCurrent) {
        const experience = this.workExperiences.find(exp => exp.id === id);
        if (experience) {
            experience.current = isCurrent;
            if (isCurrent) {
                experience.endDate = '';
            }
            this.renderWorkExperiences();
        }
    }

    // Certificate management functions
    addCertificate(certificate = {}) {
        // Check authentication first
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to manage certificates', 'error');
            this.switchTab('auth');
            return;
        }
        const id = Date.now().toString();
        const newCertificate = {
            id,
            name: certificate.name || '',
            issuer: certificate.issuer || '',
            issueDate: certificate.issueDate || '',
            expiryDate: certificate.expiryDate || '',
            credentialId: certificate.credentialId || ''
        };

        this.certificates.push(newCertificate);
        this.renderCertificates();
    }

    removeCertificate(id) {
        this.certificates = this.certificates.filter(cert => cert.id !== id);
        this.renderCertificates();
    }

    renderCertificates() {
        const container = document.getElementById('certificates');
        container.innerHTML = '';

        this.certificates.forEach(certificate => {
            const certificateEl = this.createCertificateElement(certificate);
            container.appendChild(certificateEl);
        });
    }

    createCertificateElement(certificate) {
        const div = document.createElement('div');
        div.className = 'certificate-item';
        div.innerHTML = `
            <div class="certificate-header">
                <div class="certificate-title">${certificate.name || 'New Certificate'}</div>
                <button class="remove-certificate" data-cert-id="${certificate.id}">×</button>
            </div>
            <div class="certificate-form">
                <div class="form-group">
                    <label>Certificate Name</label>
                    <input type="text" value="${certificate.name}" 
                           placeholder="e.g., AWS Solutions Architect"
                           data-field="name" data-cert-id="${certificate.id}">
                </div>
                <div class="form-group">
                    <label>Issuing Organization</label>
                    <input type="text" value="${certificate.issuer}" 
                           placeholder="e.g., Amazon Web Services"
                           data-field="issuer" data-cert-id="${certificate.id}">
                </div>
                <div class="form-group">
                    <label>Issue Date</label>
                    <input type="month" value="${certificate.issueDate}" 
                           data-field="issueDate" data-cert-id="${certificate.id}">
                </div>
                <div class="form-group">
                    <label>Expiry Date (Optional)</label>
                    <input type="month" value="${certificate.expiryDate}" 
                           placeholder="Leave empty if no expiry"
                           data-field="expiryDate" data-cert-id="${certificate.id}">
                </div>
                <div class="form-group">
                    <label>Credential ID (Optional)</label>
                    <input type="text" value="${certificate.credentialId}" 
                           placeholder="e.g., ABC123456"
                           data-field="credentialId" data-cert-id="${certificate.id}">
                </div>
            </div>
        `;
        
        // Add event listener for remove button
        const removeBtn = div.querySelector('.remove-certificate');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeCertificate(certificate.id);
            });
        }
        
        // Add event listeners for all form fields
        const inputs = div.querySelectorAll('input[data-cert-id]');
        inputs.forEach(input => {
            const field = input.dataset.field;
            const certId = input.dataset.certId;
            
            input.addEventListener('change', (e) => {
                this.updateCertificate(certId, field, e.target.value);
            });
        });
        
        return div;
    }

    updateCertificate(id, field, value) {
        const certificate = this.certificates.find(cert => cert.id === id);
        if (certificate) {
            certificate[field] = value;
            if (field === 'name') {
                this.renderCertificates();
            }
        }
    }

    // File handling
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processResumeFile(files[0]);
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processResumeFile(file);
        }
    }

    processResumeFile(file) {
        // Check authentication first
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to upload resumes', 'error');
            this.switchTab('auth');
            return;
        }
        if (!this.isValidFileType(file)) {
            this.showNotification('Please upload a PDF or DOC file', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showNotification('File size too large. Please upload a file smaller than 10MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                uploadDate: new Date().toISOString()
            };

            chrome.storage.local.set({ uploadedResume: fileData });
            this.showUploadedFile(fileData);
        };
        reader.readAsDataURL(file);
    }

    isValidFileType(file) {
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        return validTypes.includes(file.type);
    }

    showUploadedFile(fileData) {
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('uploadedFile').style.display = 'block';
        document.querySelector('.file-name').textContent = fileData.name;
    }

    removeUploadedFile() {
        chrome.storage.local.remove('uploadedResume');
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('uploadedFile').style.display = 'none';
        document.getElementById('resumeFile').value = '';
    }

    async parseResume() {
        // Check authentication first
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to parse resumes', 'error');
            this.switchTab('auth');
            return;
        }
        try {
            this.showNotification('Parsing resume...', 'info');
            
            // Get the uploaded file data from storage
            const data = await chrome.storage.local.get('uploadedResume');
            if (!data.uploadedResume) {
                throw new Error('No resume file found. Please upload a resume first.');
            }
            
            const fileData = data.uploadedResume;
            
            // Call backend API to parse resume (authenticated)
            const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/parse-resume', {
                method: 'POST',
                body: JSON.stringify({
                    fileData: fileData.data,
                    fileName: fileData.name,
                    fileType: fileData.type
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Populate the form fields with parsed data
                await this.populateFormWithParsedData(result.data);
                this.showNotification('Resume parsed successfully! Check the Profile tab.', 'success');
                
                // Switch to profile tab to show the results
                this.switchTab('profile');
            } else {
                throw new Error(result.details || 'Resume parsing failed');
            }
            
        } catch (error) {
            console.error('Error parsing resume:', error);
            this.showNotification(`Error parsing resume: ${error.message}`, 'error');
        }
    }

    async populateFormWithParsedData(parsedData) {
        try {
            // Fill in basic profile information
            if (parsedData.name) document.getElementById('name').value = parsedData.name;
            if (parsedData.email) document.getElementById('email').value = parsedData.email;
            if (parsedData.phone) document.getElementById('phone').value = parsedData.phone;
            if (parsedData.address) document.getElementById('address').value = parsedData.address;
            if (parsedData.linkedin) document.getElementById('linkedin').value = parsedData.linkedin;
            if (parsedData.skills) document.getElementById('skills').value = parsedData.skills;
            if (parsedData.education) document.getElementById('education').value = parsedData.education;
            if (parsedData.languages) document.getElementById('languages').value = parsedData.languages;
            
            // Clear existing work experiences
            this.workExperiences = [];
            
            // Add parsed work experiences
            if (parsedData.workExperience && parsedData.workExperience.length > 0) {
                parsedData.workExperience.forEach(exp => {
                    this.addWorkExperience(exp);
                });
            }
            
            // Save to storage
            await this.saveProfile();
            
            this.showNotification('Profile populated with parsed resume data!', 'success');
            
        } catch (error) {
            console.error('Error populating form:', error);
            this.showNotification('Error populating form with parsed data', 'error');
        }
    }

    handleReferenceUpload(e) {
        const file = e.target.files[0];
        if (file && this.isValidFileType(file)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const referenceData = {
                    name: file.name,
                    type: file.type,
                    data: e.target.result,
                    uploadDate: new Date().toISOString()
                };
                chrome.storage.local.set({ referenceCV: referenceData });
                this.showNotification('Reference CV uploaded successfully!', 'success');
            };
            reader.readAsDataURL(file);
        }
    }

    // Job platform integration (LinkedIn & Naukri)
    async checkJobPlatformStatus() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentTab = tabs[0];
            
            if (currentTab.url) {
                const platform = this.detectJobPlatform(currentTab.url);
                this.updateJobPlatformStatus(platform);
            } else {
                this.updateJobPlatformStatus(null);
            }
        } catch (error) {
            console.error('Error checking job platform status:', error);
            this.updateJobPlatformStatus(null);
        }
    }

    detectJobPlatform(url) {
        if (url.includes('linkedin.com/jobs')) {
            return { name: 'LinkedIn', detected: true };
        } else if (url.includes('naukri.com/job-listings-')) {
            return { name: 'Naukri', detected: true };
        } else {
            return { name: null, detected: false };
        }
    }

    updateJobPlatformStatus(platform) {
        const statusEl = document.getElementById('detectionStatus');
        const analyzeBtn = document.getElementById('analyzeJob');
        
        if (platform && platform.detected) {
            statusEl.className = 'detection-status success';
            statusEl.innerHTML = `
                <span class="status-icon">✅</span>
                <span class="status-message">${platform.name} job posting detected</span>
            `;
            analyzeBtn.disabled = false;
            
            // Clear previous results when on a new job page
            this.clearPreviousResults();
        } else {
            statusEl.className = 'detection-status';
            statusEl.innerHTML = `
                <span class="status-icon">⚠️</span>
                <span class="status-message">Please navigate to a LinkedIn or Naukri job posting</span>
            `;
            analyzeBtn.disabled = true;
        }
    }

    clearPreviousResults() {
        // Hide customization results
        const resultsSection = document.getElementById('customizationResults');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
        
        // Reset score display
        const scoreValue = document.getElementById('scoreValue');
        const scoreCircle = document.getElementById('scoreCircle');
        const keywordCount = document.getElementById('keywordCount');
        const missingCount = document.getElementById('missingCount');
        const resumePreview = document.getElementById('resumePreview');
        
        if (scoreValue) scoreValue.textContent = '0%';
        if (scoreCircle) scoreCircle.style.background = 'conic-gradient(var(--primary-color) 0deg, var(--border) 0deg)';
        if (keywordCount) keywordCount.textContent = '0';
        if (missingCount) missingCount.textContent = '0';
        if (resumePreview) resumePreview.innerHTML = '';
        
        console.log('Previous analysis results cleared for new job');
    }

    async analyzeJobAndCustomize() {
        // Check authentication first
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to analyze job postings', 'error');
            this.switchTab('auth');
            return;
        }
        try {
            // Clear previous analysis results first
            this.clearPreviousResults();
            
            // Show loading spinner
            this.showLoadingSpinner();
            
            // Get job data from content script
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            
            try {
                const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'extractJobData' });
                
                if (response && response.jobData) {
                    // Store job data for history tracking with current URL
                    this.lastJobData = {
                        ...response.jobData,
                        postingUrl: tabs[0].url
                    };
                    
                    // Process with AI backend
                    const customizedResume = await this.customizeResumeWithAI(response.jobData);
                    this.displayCustomizationResults(customizedResume);
                } else if (response && response.error) {
                    throw new Error(response.error);
                } else {
                    throw new Error('Could not extract job data from current page');
                }
            } catch (connectionError) {
                if (connectionError.message.includes('Receiving end does not exist')) {
                    throw new Error('Please make sure you are on a LinkedIn job posting page and refresh the page');
                } else {
                    throw connectionError;
                }
            }
        } catch (error) {
            console.error('Error analyzing job:', error);
            this.hideLoadingSpinner();
            this.showNotification(`Error analyzing job posting: ${error.message}`, 'error');
        }
    }

    async customizeResumeWithAI(jobData) {
        try {
            this.updateLoadingProgress(25, 'Extracting job requirements...');
            
            const profileData = this.getProfileData();
            
            // Validate required data
            if (!jobData || !jobData.title) {
                throw new Error('Invalid job data - please ensure you are on a LinkedIn job posting');
            }
            
            if (!profileData.name || !profileData.designation) {
                throw new Error('Please fill in your name and designation in the Profile tab first');
            }
            
            this.updateLoadingProgress(50, 'Generating AI-optimized content...');
            
            // Call backend API with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/ai/customize', {
                method: 'POST',
                body: JSON.stringify({
                    jobData: jobData,
                    resumeData: {
                        ...profileData,
                        workExperience: this.workExperiences,
                        certificates: this.certificates,
                        languages: profileData.languages ? profileData.languages.split(',').map(lang => lang.trim()) : [],
                        skills: profileData.skills ? profileData.skills.split(',').map(skill => skill.trim()) : []
                    }
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                
                // Try to parse error response for insufficient coins
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error === 'Insufficient coins') {
                        throw new Error(`Insufficient coins: ${errorData.message}`);
                    }
                } catch (parseError) {
                    // If parsing fails, use original error handling
                }
                
                throw new Error(`Backend error (${response.status}): ${errorText || response.statusText}`);
            }

            this.updateLoadingProgress(75, 'Processing ATS optimization...');
            
            const result = await response.json();
            
            this.updateLoadingProgress(100, 'Finalizing customized resume...');
            
            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.hideLoadingSpinner();
            
            if (!result.success) {
                throw new Error(result.error || result.details || 'AI customization failed');
            }

            // Update coin balance if deduction info is provided
            if (result.coinInfo && result.coinInfo.newBalance !== undefined) {
                this.updateCoinBalance(result.coinInfo.newBalance);
                this.showNotification(`Resume customized successfully! ${result.coinInfo.deducted} coins deducted. Balance: ${result.coinInfo.newBalance}`, 'success');
                // Reload transaction history to show the deduction
                await this.loadRecentTransactions();
            } else {
                this.showNotification('Resume customized successfully!', 'success');
            }
            
            // Return the proper result structure for displayCustomizationResults
            return {
                atsScore: result.atsScore,
                keywordsMatched: result.keywordsMatched,
                keywordsMissing: result.keywordsMissing,
                customizedContent: result.customizedContent,
                customizationId: result.customizationId
            };

        } catch (error) {
            console.error('AI customization error:', error);
            this.hideLoadingSpinner();
            this.showNotification('AI customization failed: ' + error.message, 'error');
            
            // Fallback to mock data if backend fails
            return {
                atsScore: 75,
                keywordsMatched: ['javascript', 'react', 'node.js'],
                keywordsMissing: ['leadership', 'agile', 'cloud'],
                customizedContent: `<div class="resume-content">
                    <h2>${this.getProfileData().name || 'Your Name'}</h2>
                    <p><strong>${this.getProfileData().designation || 'Your Title'}</strong></p>
                    <div class="section">
                        <h3>Professional Summary</h3>
                        <p>Experienced professional with skills in ${this.getProfileData().skills || 'various technologies'}. 
                        Seeking to contribute to ${jobData.company || 'target company'} as ${jobData.title || 'target position'}.</p>
                    </div>
                    <div class="section">
                        <h3>Core Skills</h3>
                        <p>${this.getProfileData().skills || 'Technical skills and expertise'}</p>
                    </div>
                </div>`,
                recommendations: [
                    'Backend connection failed - using fallback response',
                    'Set up backend with API keys for full AI features',
                    'Check console for detailed error information'
                ]
            };
        }
    }

    displayCustomizationResults(results) {
        document.getElementById('customizationResults').style.display = 'block';
        
        // Update ATS score
        const scoreValue = document.getElementById('scoreValue');
        const scoreCircle = document.getElementById('scoreCircle');
        const keywordCount = document.getElementById('keywordCount');
        const missingCount = document.getElementById('missingCount');
        
        scoreValue.textContent = `${results.atsScore}%`;
        keywordCount.textContent = Array.isArray(results.keywordsMatched) ? results.keywordsMatched.length : results.keywordsMatched;
        missingCount.textContent = Array.isArray(results.keywordsMissing) ? results.keywordsMissing.length : results.keywordsMissing;
        
        // Update score circle color
        const degree = (results.atsScore / 100) * 360;
        scoreCircle.style.background = `conic-gradient(var(--primary-color) ${degree}deg, var(--border) ${degree}deg)`;
        
        // Update resume preview
        const resumePreview = document.getElementById('resumePreview');
        resumePreview.innerHTML = results.customizedContent;
        
        // Add scroll indicator if content overflows
        setTimeout(() => {
            if (resumePreview.scrollHeight > resumePreview.clientHeight) {
                resumePreview.style.borderBottom = '3px solid var(--primary-color)';
                resumePreview.title = 'Scroll down to see more content';
            }
        }, 100);
        
        // Save to customization history
        this.saveToHistory(results);
    }

    // Download functionality
    async downloadResume(format) {
        // Check authentication first
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to download resumes', 'error');
            this.switchTab('auth');
            return;
        }
        try {
            this.showNotification(`Generating ${format.toUpperCase()}...`, 'info');
            
            const resumePreview = document.getElementById('resumePreview');
            if (!resumePreview || !resumePreview.innerHTML.trim()) {
                throw new Error('No resume content to download. Please generate a customized resume first.');
            }

            const htmlContent = resumePreview.innerHTML;
            const filename = `resume_${Date.now()}`;
            
            if (format === 'pdf') {
                // Call backend to generate actual PDF (authenticated)
                const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/download/pdf', {
                    method: 'POST',
                    body: JSON.stringify({
                        htmlContent: htmlContent,
                        filename: filename
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                // Get the PDF as a blob
                const pdfBlob = await response.blob();
                
                // Create download URL
                const url = URL.createObjectURL(pdfBlob);
                
                // Download the actual PDF file
                try {
                    if (chrome && chrome.downloads && chrome.downloads.download) {
                        chrome.downloads.download({
                            url: url,
                            filename: filename + '.pdf',
                            conflictAction: 'uniquify'
                        }, (downloadId) => {
                            if (chrome.runtime.lastError) {
                                console.error('Chrome download error:', chrome.runtime.lastError);
                                this.triggerDirectDownload(url, filename + '.pdf');
                                this.showNotification('PDF downloaded successfully!', 'success');
                            } else {
                                this.showNotification('PDF downloaded successfully!', 'success');
                            }
                        });
                    } else {
                        this.triggerDirectDownload(url, filename + '.pdf');
                        this.showNotification('PDF downloaded successfully!', 'success');
                    }
                } catch (downloadError) {
                    console.error('Download error:', downloadError);
                    this.triggerDirectDownload(url, filename + '.pdf');
                    this.showNotification('PDF downloaded successfully!', 'success');
                }
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                
            } else {
                // For DOC format, call backend to generate actual Word document
                const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/download/doc', {
                    method: 'POST',
                    body: JSON.stringify({
                        htmlContent: htmlContent,
                        filename: filename
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                // Get the DOC as a blob
                const docBlob = await response.blob();
                
                // Create download URL
                const url = URL.createObjectURL(docBlob);
                
                try {
                    if (chrome && chrome.downloads && chrome.downloads.download) {
                        chrome.downloads.download({
                            url: url,
                            filename: filename + '.doc',
                            conflictAction: 'uniquify'
                        }, (downloadId) => {
                            if (chrome.runtime.lastError) {
                                console.error('Chrome download error:', chrome.runtime.lastError);
                                this.triggerDirectDownload(url, filename + '.doc');
                                this.showNotification('DOC document downloaded successfully!', 'success');
                            } else {
                                this.showNotification('DOC document downloaded successfully!', 'success');
                            }
                        });
                    } else {
                        this.triggerDirectDownload(url, filename + '.doc');
                        this.showNotification('DOC document downloaded successfully!', 'success');
                    }
                } catch (downloadError) {
                    console.error('Download error:', downloadError);
                    this.triggerDirectDownload(url, filename + '.doc');
                    this.showNotification('DOC document downloaded successfully!', 'success');
                }
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            
        } catch (error) {
            console.error('Error downloading resume:', error);
            this.showNotification(`Error downloading resume: ${error.message}`, 'error');
        }
    }

    editResume() {
        this.switchTab('profile');
        this.showNotification('Switch to Profile tab to edit your information', 'info');
    }

    // Version management
    async createNewVersion() {
        console.log('createNewVersion called');
        
        // Check authentication first
        if (!this.isAuthenticated()) {
            console.log('User not authenticated for version creation');
            this.showAuthMessage('Please log in to save versions', 'error');
            this.switchTab('auth');
            return;
        }
        
        try {
            console.log('Creating version data...');
            const versionData = {
                id: Date.now().toString(),
                name: `Version ${new Date().toLocaleString()}`,
                createdAt: new Date().toISOString(),
                profile: this.getProfileData(),
                workExperiences: this.workExperiences,
                certificates: this.certificates
            };
            
            console.log('Version data created:', versionData);

            const stored = await chrome.storage.local.get('resumeVersions');
            const versions = stored.resumeVersions || [];
            console.log('Existing versions count:', versions.length);
            
            versions.push(versionData);
            console.log('New versions count:', versions.length);
            
            await chrome.storage.local.set({ resumeVersions: versions });
            console.log('Versions saved to storage');
            
            this.renderResumeVersions(versions);
            console.log('Versions rendered');
            
            this.showNotification('New version saved!', 'success');
        } catch (error) {
            console.error('Error creating version:', error);
            this.showNotification('Error saving version', 'error');
        }
    }

    renderResumeVersions(versions) {
        const container = document.getElementById('versionsList');
        container.innerHTML = '';
        
        if (!versions || versions.length === 0) {
            container.innerHTML = '<p class="text-muted">No saved versions yet</p>';
            return;
        }
        
        versions.forEach(version => {
            const versionEl = document.createElement('div');
            versionEl.className = 'version-item';
            versionEl.innerHTML = `
                <div class="version-info">
                    <div class="version-name-container">
                        <span class="version-name" data-version-id="${version.id}" style="cursor: pointer; border: 1px solid transparent; padding: 2px 6px; border-radius: 4px;" title="Click to edit name">${version.name}</span>
                        <input class="version-name-input" data-version-id="${version.id}" value="${version.name}" style="display: none; padding: 2px 6px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text-color);" />
                    </div>
                    <div class="version-date">${new Date(version.createdAt).toLocaleString()}</div>
                </div>
                <div class="version-actions">
                    <button class="btn btn-secondary" data-version-id="${version.id}" data-action="load">Load</button>
                    <button class="btn btn-remove" data-version-id="${version.id}" data-action="delete">×</button>
                </div>
            `;
            
            // Add event listeners for CSP compliance
            const loadBtn = versionEl.querySelector('[data-action="load"]');
            const deleteBtn = versionEl.querySelector('[data-action="delete"]');
            const versionNameSpan = versionEl.querySelector('.version-name');
            const versionNameInput = versionEl.querySelector('.version-name-input');
            
            loadBtn.addEventListener('click', () => {
                this.loadVersion(version.id);
            });
            
            deleteBtn.addEventListener('click', () => {
                this.deleteVersion(version.id);
            });
            
            // Edit version name functionality
            versionNameSpan.addEventListener('click', () => {
                versionNameSpan.style.display = 'none';
                versionNameInput.style.display = 'inline-block';
                versionNameInput.focus();
                versionNameInput.select();
            });
            
            versionNameInput.addEventListener('blur', () => {
                this.saveVersionName(version.id, versionNameInput.value);
                versionNameSpan.textContent = versionNameInput.value;
                versionNameSpan.style.display = 'inline-block';
                versionNameInput.style.display = 'none';
            });
            
            versionNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    versionNameInput.blur();
                } else if (e.key === 'Escape') {
                    versionNameInput.value = version.name;
                    versionNameInput.blur();
                }
            });
            
            container.appendChild(versionEl);
        });
    }

    async loadVersion(versionId) {
        try {
            const stored = await chrome.storage.local.get('resumeVersions');
            const versions = stored.resumeVersions || [];
            const version = versions.find(v => v.id === versionId);
            
            if (version) {
                this.loadProfile(version.profile);
                this.workExperiences = version.workExperiences || [];
                this.certificates = version.certificates || [];
                this.renderWorkExperiences();
                this.renderCertificates();
                this.switchTab('profile');
                this.showNotification('Version loaded successfully!', 'success');
            }
        } catch (error) {
            console.error('Error loading version:', error);
            this.showNotification('Error loading version', 'error');
        }
    }

    async deleteVersion(versionId) {
        try {
            const stored = await chrome.storage.local.get('resumeVersions');
            const versions = stored.resumeVersions || [];
            const filteredVersions = versions.filter(v => v.id !== versionId);
            
            await chrome.storage.local.set({ resumeVersions: filteredVersions });
            this.renderResumeVersions(filteredVersions);
            this.showNotification('Version deleted!', 'success');
        } catch (error) {
            console.error('Error deleting version:', error);
            this.showNotification('Error deleting version', 'error');
        }
    }

    async saveVersionName(versionId, newName) {
        try {
            if (!newName.trim()) {
                this.showNotification('Version name cannot be empty', 'error');
                return;
            }
            
            const stored = await chrome.storage.local.get('resumeVersions');
            const versions = stored.resumeVersions || [];
            const versionIndex = versions.findIndex(v => v.id === versionId);
            
            if (versionIndex !== -1) {
                versions[versionIndex].name = newName.trim();
                await chrome.storage.local.set({ resumeVersions: versions });
                this.showNotification('Version name updated!', 'success');
            }
        } catch (error) {
            console.error('Error saving version name:', error);
            this.showNotification('Error updating version name', 'error');
        }
    }

    // Auto-save functionality
    setupAutoSave() {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', this.debounce(() => {
                this.autoSave();
            }, 1000));
        });
    }

    async autoSave() {
        try {
            const profileData = this.getProfileData();
            await chrome.storage.local.set({ 
                profile: profileData,
                workExperiences: this.workExperiences,
                certificates: this.certificates
            });
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showNotification(message, type = 'info') {
        // Simple notification system - you could enhance this
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Update status indicator
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        
        statusText.textContent = message;
        statusDot.style.background = type === 'success' ? 'var(--success-color)' : 
                                   type === 'error' ? 'var(--error-color)' : 
                                   'var(--warning-color)';
        
        setTimeout(() => {
            statusText.textContent = 'Ready';
            statusDot.style.background = 'var(--success-color)';
        }, 3000);
    }

    // Version Modal Methods
    showVersionModal() {
        // Check authentication first
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to view version information', 'error');
            this.switchTab('auth');
            return;
        }
        
        const modal = document.getElementById('versionModal');
        modal.style.display = 'flex';
        
        // Update current version from manifest
        this.updateCurrentVersion();
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideVersionModal();
            }
        });

        // Add ESC key to close
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                this.hideVersionModal();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
    }

    hideVersionModal() {
        const modal = document.getElementById('versionModal');
        modal.style.display = 'none';
    }

    async updateCurrentVersion() {
        try {
            // Get version from manifest
            const manifestResponse = await fetch(chrome.runtime.getURL('manifest.json'));
            const manifest = await manifestResponse.json();
            
            // Update version badge
            const versionBadge = document.querySelector('.version-badge.current');
            if (versionBadge) {
                versionBadge.textContent = `v${manifest.version}`;
            }

            // Update current version in history
            const currentVersionNumber = document.querySelector('.version-history .version-item:first-child .version-number');
            if (currentVersionNumber) {
                currentVersionNumber.textContent = `v${manifest.version}`;
            }

        } catch (error) {
            console.log('Could not fetch manifest version:', error);
            // Fallback to default version
        }
    }

    // Customization History Methods
    async saveToHistory(results) {
        try {
            // Get current job data from the last analysis
            const jobData = this.lastJobData || { 
                title: 'Unknown Job', 
                company: 'Unknown Company', 
                postingUrl: window.location.href 
            };
            
            // Validate and clean the posting URL
            let cleanUrl = jobData.postingUrl;
            if (cleanUrl && cleanUrl.startsWith('chrome-extension://')) {
                // For testing purposes, use a demo LinkedIn URL
                cleanUrl = 'https://www.linkedin.com/jobs/view/demo-job-posting';
                console.log('Chrome extension URL detected, using demo URL for testing');
            }
            
            const historyItem = {
                id: Date.now().toString(),
                jobTitle: jobData.title,
                company: jobData.company,
                postingUrl: cleanUrl,
                atsScore: results.atsScore,
                keywordsMatched: results.keywordsMatched,
                keywordsMissing: results.keywordsMissing,
                resumeContent: results.customizedContent,
                timestamp: new Date().toISOString(),
                profileSnapshot: {
                    name: this.getProfileData().name,
                    designation: this.getProfileData().designation
                }
            };

            const stored = await chrome.storage.local.get('customizationHistory');
            const history = stored.customizationHistory || [];
            
            // Add new item to beginning of array (most recent first)
            history.unshift(historyItem);
            
            // Keep only last 50 items to prevent storage overflow
            if (history.length > 50) {
                history.splice(50);
            }
            
            await chrome.storage.local.set({ customizationHistory: history });
            console.log('Saved customization to history:', historyItem.jobTitle);
            
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    }

    showHistoryModal() {
        // Check authentication first
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to view customization history', 'error');
            this.switchTab('auth');
            return;
        }
        
        const modal = document.getElementById('historyModal');
        modal.style.display = 'flex';
        
        // Load and display history
        this.loadCustomizationHistory();
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideHistoryModal();
            }
        });

        // Add ESC key to close
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                this.hideHistoryModal();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
    }

    hideHistoryModal() {
        const modal = document.getElementById('historyModal');
        modal.style.display = 'none';
    }

    async loadCustomizationHistory() {
        console.log('loadCustomizationHistory called');
        console.log('Auth token:', this.authToken ? 'Present' : 'Missing');
        console.log('Current user:', this.currentUser ? 'Present' : 'Missing');
        console.log('Is authenticated:', this.isAuthenticated());
        
        if (!this.isAuthenticated()) {
            console.log('User not authenticated, showing empty history');
            this.renderCustomizationHistory([]);
            return;
        }
        
        try {
            // Load history from backend
            console.log('Fetching customization history from backend...');
            const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/customization-history');
            
            if (response.ok) {
                const data = await response.json();
                console.log('History API response:', data);
                const history = data.success ? data.history : [];
                console.log('Rendering history with', history.length, 'items');
                this.renderCustomizationHistory(history);
            } else {
                console.error('Failed to load customization history, status:', response.status);
                this.renderCustomizationHistory([]);
            }
        } catch (error) {
            console.error('Error loading customization history:', error);
            this.renderCustomizationHistory([]);
        }
    }

    renderCustomizationHistory(history) {
        console.log('renderCustomizationHistory called with:', history);
        const container = document.getElementById('historyList');
        console.log('History container element:', container);
        
        if (!history || history.length === 0) {
            console.log('No history data, showing empty state');
            container.innerHTML = `
                <div class="history-empty">
                    <p>📄 No customization history yet</p>
                    <p>Generate AI-customized resumes to see them here!</p>
                </div>
            `;
            return;
        }
        
        console.log('Rendering', history.length, 'history items');

        // Add stats
        const totalCustomizations = history.length;
        const avgAtsScore = Math.round(history.reduce((sum, item) => sum + item.atsScore, 0) / history.length);
        const uniqueCompanies = [...new Set(history.map(item => item.company))].length;

        let html = `
            <div class="history-stats">
                <div class="stat-item">
                    <span class="stat-number">${totalCustomizations}</span>
                    <span class="stat-label">Total Resumes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${avgAtsScore}%</span>
                    <span class="stat-label">Avg ATS Score</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${uniqueCompanies}</span>
                    <span class="stat-label">Companies</span>
                </div>
            </div>
        `;

        history.forEach(item => {
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Fix empty postingUrl by using jobData.url if available
            let workingUrl = item.postingUrl;
            if (!workingUrl || workingUrl === '') {
                // Try to get URL from jobData if it exists
                if (item.jobData && item.jobData.url) {
                    workingUrl = item.jobData.url;
                } else {
                    // Create a search URL as fallback
                    const searchQuery = encodeURIComponent(`${item.jobTitle} ${item.company}`);
                    workingUrl = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;
                }
            }
            
            // Debug URL information
            console.log('Rendering history item:', {
                id: item.id,
                jobTitle: item.jobTitle,
                originalUrl: item.postingUrl,
                workingUrl: workingUrl,
                hasValidUrl: workingUrl && workingUrl !== 'chrome-extension://' && !workingUrl.startsWith('chrome-extension://')
            });
            
            html += `
                <div class="history-item">
                    <div class="history-header">
                        <div class="history-job-title">${item.jobTitle}</div>
                        <div class="history-timestamp">${formattedDate} ${formattedTime}</div>
                    </div>
                    <div class="history-company">${item.company}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                        ATS Score: ${item.atsScore}% | ID: ${item.id}
                    </div>
                    <div class="history-actions">
                        <div class="download-icons">
                            ${(workingUrl && workingUrl !== 'chrome-extension://' && !workingUrl.startsWith('chrome-extension://') && (workingUrl.startsWith('http://') || workingUrl.startsWith('https://'))) ? 
                                `<button class="icon-btn link-btn" data-url="${workingUrl}" title="View Job Posting">🔗</button>` : 
                                `<span class="icon-btn link-btn disabled" title="No job posting URL available">🔗</span>`
                            }
                            <button class="icon-btn pdf-btn" data-item-id="${item.id}" data-format="pdf" title="Download PDF">
                                📄
                            </button>
                            <button class="icon-btn doc-btn" data-item-id="${item.id}" data-format="doc" title="Download DOC">
                                📝
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        
        // Add event listeners to all the buttons after rendering
        this.setupHistoryButtonListeners(container);
    }

    setupHistoryButtonListeners(container) {
        // Add event listeners for link buttons
        const linkButtons = container.querySelectorAll('.link-btn[data-url]');
        linkButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const url = btn.getAttribute('data-url');
                if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                    // Use chrome.tabs.create instead of window.open for better compatibility
                    chrome.tabs.create({ url: url });
                    this.showNotification('Opening job posting...', 'info');
                } else {
                    this.showNotification('Invalid job posting URL', 'error');
                }
            });
        });
        
        // Add event listeners for PDF download buttons
        const pdfButtons = container.querySelectorAll('.pdf-btn[data-item-id]');
        pdfButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = btn.getAttribute('data-item-id');
                const format = btn.getAttribute('data-format');
                this.downloadHistoryResume(itemId, format);
            });
        });
        
        // Add event listeners for DOC download buttons
        const docButtons = container.querySelectorAll('.doc-btn[data-item-id]');
        docButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = btn.getAttribute('data-item-id');
                const format = btn.getAttribute('data-format');
                this.downloadHistoryResume(itemId, format);
            });
        });
    }

    async viewHistoryItem(itemId) {
        try {
            const stored = await chrome.storage.local.get('customizationHistory');
            const history = stored.customizationHistory || [];
            const item = history.find(h => h.id === itemId);
            
            if (item) {
                // Hide history modal temporarily
                this.hideHistoryModal();
                
                // Switch to customize tab and display the results
                this.switchTab('customize');
                
                // Simulate the results display
                const results = {
                    atsScore: item.atsScore,
                    keywordsMatched: item.keywordsMatched,
                    keywordsMissing: item.keywordsMissing,
                    customizedContent: item.resumeContent
                };
                
                this.displayCustomizationResults(results);
                this.showNotification(`Loaded resume for: ${item.jobTitle}`, 'success');
            }
        } catch (error) {
            console.error('Error viewing history item:', error);
            this.showNotification('Error loading history item', 'error');
        }
    }

    async deleteHistoryItem(itemId) {
        try {
            const stored = await chrome.storage.local.get('customizationHistory');
            const history = stored.customizationHistory || [];
            const filteredHistory = history.filter(h => h.id !== itemId);
            
            await chrome.storage.local.set({ customizationHistory: filteredHistory });
            this.renderCustomizationHistory(filteredHistory);
            this.showNotification('History item deleted!', 'success');
            
        } catch (error) {
            console.error('Error deleting history item:', error);
            this.showNotification('Error deleting history item', 'error');
        }
    }

    async clearCustomizationHistory() {
        try {
            await chrome.storage.local.set({ customizationHistory: [] });
            this.renderCustomizationHistory([]);
            this.showNotification('History cleared!', 'success');
            
        } catch (error) {
            console.error('Error clearing history:', error);
            this.showNotification('Error clearing history', 'error');
        }
    }

    // Add test history item with working URL for testing
    async addTestHistoryItem() {
        try {
            const testItem = {
                id: Date.now().toString(),
                jobTitle: 'Senior Software Engineer',
                company: 'LinkedIn Corporation',
                postingUrl: 'https://www.linkedin.com/jobs/view/3234567890/',
                atsScore: 85,
                keywordsMatched: ['JavaScript', 'React', 'Node.js'],
                keywordsMissing: ['Python', 'AWS'],
                resumeContent: '<html><head><title>Test Resume</title></head><body><h1>John Doe</h1><h2>Senior Software Engineer</h2><p>Experienced developer with expertise in JavaScript, React, and Node.js. Looking for challenging opportunities to contribute to innovative projects.</p><h3>Experience</h3><ul><li>Software Engineer at Tech Corp (2020-2023)</li><li>Junior Developer at StartupXYZ (2018-2020)</li></ul></body></html>',
                timestamp: new Date().toISOString(),
                profileSnapshot: {
                    name: 'Test User',
                    designation: 'Software Developer'
                }
            };

            const stored = await chrome.storage.local.get('customizationHistory');
            const history = stored.customizationHistory || [];
            history.unshift(testItem);
            
            await chrome.storage.local.set({ customizationHistory: history });
            this.loadCustomizationHistory();
            this.showNotification('Test history item added with working link & downloads!', 'success');
            console.log('Test history item added:', testItem.id);
            
        } catch (error) {
            console.error('Error adding test history item:', error);
            this.showNotification('Error adding test item: ' + error.message, 'error');
        }
    }

    async downloadHistoryResume(itemId, format) {
        try {
            console.log('downloadHistoryResume called with:', { itemId, format });
            console.log('itemId type:', typeof itemId);
            
            // Get history from backend instead of local storage
            const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/customization-history');
            if (!response.ok) {
                throw new Error('Failed to load history from backend');
            }
            
            const data = await response.json();
            const history = data.success ? data.history : [];
            console.log('Total history items from backend:', history.length);
            console.log('History item IDs:', history.map(h => ({ id: h.id, title: h.jobTitle })));
            
            // Convert both IDs to strings for comparison to handle type mismatches
            const item = history.find(h => String(h.id) === String(itemId));
            console.log('Looking for item with ID:', itemId, 'Type:', typeof itemId);
            console.log('Available IDs:', history.map(h => ({ id: h.id, type: typeof h.id })));
            console.log('Found item:', item ? item.jobTitle : 'NOT FOUND');
            
            if (!item) {
                console.log('Item not found in history. Available IDs:', history.map(h => h.id));
                this.showNotification('Resume not found in history', 'error');
                return;
            }
            
            console.log('Found history item:', item.jobTitle);

            this.showNotification(`Generating ${format.toUpperCase()}...`, 'info');
            
            const htmlContent = item.resumeContent;
            const filename = `${item.jobTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
            
            if (format === 'pdf') {
                // Check authentication first
                if (!this.authToken) {
                    console.log('No auth token available for PDF download');
                    this.showNotification('Please log in to download PDFs', 'error');
                    return;
                }
                
                console.log('Making authenticated request for PDF...');
                // Call backend to generate PDF (authenticated)
                const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/download/pdf', {
                    method: 'POST',
                    body: JSON.stringify({
                        htmlContent: htmlContent,
                        filename: filename
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                // Get the PDF as a blob
                const pdfBlob = await response.blob();
                
                // Create download URL
                const url = URL.createObjectURL(pdfBlob);
                
                // Download the PDF file
                console.log('Downloading PDF with filename:', filename + '.pdf');
                try {
                    // Use Chrome downloads API if available, fallback to direct download
                    if (chrome && chrome.downloads && chrome.downloads.download) {
                        chrome.downloads.download({
                            url: url,
                            filename: filename + '.pdf',
                            conflictAction: 'uniquify'
                        }, (downloadId) => {
                            if (chrome.runtime.lastError) {
                                console.error('Chrome download error:', chrome.runtime.lastError);
                                this.showNotification('Download failed: ' + chrome.runtime.lastError.message, 'error');
                                // Fallback to direct download
                                this.triggerDirectDownload(url, filename + '.pdf');
                            } else {
                                console.log('Download started with ID:', downloadId);
                                this.showNotification('PDF download started!', 'success');
                            }
                        });
                    } else {
                        // Fallback to direct download
                        this.triggerDirectDownload(url, filename + '.pdf');
                        this.showNotification('PDF download started!', 'success');
                    }
                } catch (downloadError) {
                    console.error('Chrome download API error:', downloadError);
                    this.triggerDirectDownload(url, filename + '.pdf');
                    this.showNotification('PDF download started!', 'success');
                }
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                
            } else {
                // For DOC format, call backend to generate actual Word document
                console.log('Making authenticated request for DOC...');
                const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/download/doc', {
                    method: 'POST',
                    body: JSON.stringify({
                        htmlContent: htmlContent,
                        filename: filename
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                // Get the DOC as a blob
                const docBlob = await response.blob();
                
                // Create download URL
                const url = URL.createObjectURL(docBlob);
                
                console.log('Downloading DOC file with filename:', filename + '.doc');
                try {
                    // Use Chrome downloads API if available, fallback to direct download
                    if (chrome && chrome.downloads && chrome.downloads.download) {
                        chrome.downloads.download({
                            url: url,
                            filename: filename + '.doc',
                            conflictAction: 'uniquify'
                        }, (downloadId) => {
                            if (chrome.runtime.lastError) {
                                console.error('Chrome download error:', chrome.runtime.lastError);
                                this.showNotification('Download failed: ' + chrome.runtime.lastError.message, 'error');
                                // Fallback to direct download
                                this.triggerDirectDownload(url, filename + '.doc');
                            } else {
                                console.log('Download started with ID:', downloadId);
                                this.showNotification('DOC download started!', 'success');
                            }
                        });
                    } else {
                        // Fallback to direct download
                        this.triggerDirectDownload(url, filename + '.doc');
                        this.showNotification('DOC download started!', 'success');
                    }
                } catch (downloadError) {
                    console.error('Chrome download API error:', downloadError);
                    this.triggerDirectDownload(url, filename + '.doc');
                    this.showNotification('DOC download started!', 'success');
                }
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            
        } catch (error) {
            console.error('Error downloading resume:', error);
            this.showNotification(`Error downloading resume: ${error.message}`, 'error');
        }
    }

    // Loading Spinner Controls
    showLoadingSpinner() {
        const loadingContainer = document.getElementById('loadingContainer');
        const customizationResults = document.getElementById('customizationResults');
        
        if (loadingContainer) {
            loadingContainer.style.display = 'block';
        }
        if (customizationResults) {
            customizationResults.style.display = 'none';
        }
        
        this.updateLoadingProgress(0, 'Starting analysis...');
    }

    hideLoadingSpinner() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
    }

    updateLoadingProgress(percentage, message) {
        const loadingText = document.getElementById('loadingText');
        const loadingPercentage = document.getElementById('loadingPercentage');
        const spinnerRing = document.querySelector('.spinner-ring');
        
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        if (loadingPercentage) {
            loadingPercentage.textContent = `${percentage}%`;
        }
        
        if (spinnerRing) {
            const degrees = (percentage / 100) * 360;
            spinnerRing.style.background = `conic-gradient(var(--primary-color) ${degrees}deg, var(--border) ${degrees}deg)`;
        }
    }

    // Authentication methods
    setupAuthEventListeners() {
        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        document.getElementById('forgotPasswordFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Form navigation
        document.getElementById('showSignupForm').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupForm();
        });

        document.getElementById('showLoginForm').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        document.getElementById('showForgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotPasswordForm();
        });

        document.getElementById('backToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Password toggle functionality
        document.querySelectorAll('.password-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePasswordVisibility(btn.dataset.target);
            });
        });
    }

    setupCoinEventListeners() {
        // Preset recharge buttons (now in modal)
        document.querySelectorAll('.recharge-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                this.rechargeCoins(amount);
            });
        });

        // Custom recharge button (now in modal)
        const customRechargeBtn = document.getElementById('customRechargeBtn');
        if (customRechargeBtn) {
            customRechargeBtn.addEventListener('click', () => {
                const amountInput = document.getElementById('customCoinAmount');
                const amount = parseInt(amountInput.value);
                if (amount > 0) {
                    this.rechargeCoins(amount);
                    amountInput.value = '';
                } else {
                    this.showAuthMessage('Please enter a valid amount', 'error');
                }
            });
        }

        // View transactions button (now in modal)
        const viewTransactionsBtn = document.getElementById('viewTransactionsBtn');
        if (viewTransactionsBtn) {
            viewTransactionsBtn.addEventListener('click', () => {
                this.showTransactionHistory();
            });
        }


        // Coin balance click to view transactions
        document.getElementById('coinBalance').addEventListener('click', () => {
            this.showTransactionsFromCoinBalance();
        });
    }

    async rechargeCoins(amount) {
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to recharge coins', 'error');
            return;
        }

        try {
            // Calculate price based on coin amount (₹2 per coin for demo)
            const priceInINR = amount * 2; // You can adjust the pricing
            
            // Create Razorpay order
            const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/payment/create-order', {
                method: 'POST',
                body: JSON.stringify({
                    amount: priceInINR,
                    currency: 'INR',
                    coins: amount
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create payment order');
            }

            const orderData = await response.json();
            if (!orderData.success) {
                throw new Error(orderData.message || 'Payment order creation failed');
            }

            // Check if this is a mock payment (for development)
            if (orderData.mock) {
                this.showAuthMessage('✅ Mock payment successful! Coins credited immediately. (Razorpay not configured)', 'success');
                
                // Reload coin balance immediately
                setTimeout(async () => {
                    await this.loadCoinBalance();
                    await this.loadRecentTransactions();
                }, 1000);
                return;
            }

            // Get user info for payment
            const userInfo = this.getCurrentUser();
            const userEmail = userInfo?.email || 'user@example.com';

            // Configure Razorpay checkout options
            const options = {
                key: orderData.order.key_id,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: 'KUPOSU AI Resume Maker',
                description: `Purchase ${amount} coins`,
                order_id: orderData.order.id,
                handler: async (response) => {
                    // Payment successful
                    this.showAuthMessage('Payment successful! Coins will be credited shortly.', 'success');
                    
                    // Reload coin balance after a short delay
                    setTimeout(async () => {
                        await this.loadCoinBalance();
                        await this.loadRecentTransactions();
                    }, 2000);
                },
                prefill: {
                    name: userInfo?.name || 'User',
                    email: userEmail,
                    contact: userInfo?.phone || ''
                },
                notes: {
                    coins: amount.toString(),
                    user_email: userEmail
                },
                theme: {
                    color: '#4A90E2'
                },
                modal: {
                    ondismiss: () => {
                        this.showAuthMessage('Payment cancelled', 'info');
                    }
                }
            };

            // Open Razorpay checkout
            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment initiation error:', error);
            this.showAuthMessage('Failed to initiate payment: ' + error.message, 'error');
        }
    }


    async checkAuthStatus() {
        try {
            const data = await chrome.storage.local.get(['authToken', 'currentUser']);
            if (data.authToken && data.currentUser) {
                this.authToken = data.authToken;
                this.currentUser = data.currentUser;
                this.showLoggedInState();
                this.updateTabAccessibility();
                await this.loadUserSpecificData(); // Load user-specific data from backend
                this.switchTab('profile');
            } else {
                this.showLoginForm();
                this.updateTabAccessibility();
                this.switchTab('auth');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showLoginForm();
            this.updateTabAccessibility();
        }
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('forgotPasswordForm').style.display = 'none';
        document.getElementById('loggedInState').style.display = 'none';
        document.getElementById('coinManagement').style.display = 'none';
        this.hideAuthMessage();
    }

    showSignupForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
        document.getElementById('forgotPasswordForm').style.display = 'none';
        document.getElementById('loggedInState').style.display = 'none';
        this.hideAuthMessage();
    }

    showForgotPasswordForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('forgotPasswordForm').style.display = 'block';
        document.getElementById('loggedInState').style.display = 'none';
        this.hideAuthMessage();
    }

    showLoggedInState() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('forgotPasswordForm').style.display = 'none';
        document.getElementById('loggedInState').style.display = 'block';
        document.getElementById('coinManagement').style.display = 'block';
        
        if (this.currentUser) {
            document.getElementById('userEmail').textContent = this.currentUser.email;
            document.getElementById('lastLogin').textContent = 
                this.currentUser.lastLogin ? 
                `Last login: ${new Date(this.currentUser.lastLogin).toLocaleDateString()}` : 
                'Welcome to AI Resume Customizer!';
            
        }
        this.hideAuthMessage();
    }

    showAuthMessage(message, type = 'info') {
        const messageEl = document.getElementById('authMessage');
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        messageEl.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => this.hideAuthMessage(), 5000);
        }
    }

    hideAuthMessage() {
        document.getElementById('authMessage').style.display = 'none';
    }

    async handleSignup() {
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        if (!name || !email || !password) {
            this.showAuthMessage('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAuthMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            this.showAuthMessage('Creating account...', 'info');
            
            const response = await fetch('http://localhost:4003/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.showAuthMessage('Account created successfully! Please check your email to verify your account.', 'success');
                document.getElementById('signupFormElement').reset();
                setTimeout(() => this.showLoginForm(), 2000);
            } else {
                this.showAuthMessage(data.message || 'Signup failed', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showAuthMessage('Network error. Please try again.', 'error');
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showAuthMessage('Please enter both email and password', 'error');
            return;
        }

        try {
            this.showAuthMessage('Signing in...', 'info');

            const response = await fetch('http://localhost:4003/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store authentication data
                this.authToken = data.token;
                this.currentUser = data.user;

                await chrome.storage.local.set({
                    authToken: this.authToken,
                    currentUser: this.currentUser
                });

                this.showAuthMessage('Login successful!', 'success');
                document.getElementById('loginFormElement').reset();
                this.showLoggedInState();
                this.updateTabAccessibility(); // Update tab access after login
                await this.loadUserSpecificData(); // Load user-specific data from backend
                setTimeout(() => this.switchTab('profile'), 1000);
            } else {
                this.showAuthMessage(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAuthMessage('Network error. Please try again.', 'error');
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById('forgotEmail').value.trim();

        if (!email) {
            this.showAuthMessage('Please enter your email address', 'error');
            return;
        }

        try {
            this.showAuthMessage('Sending reset link...', 'info');

            const response = await fetch('http://localhost:4003/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                this.showAuthMessage('Password reset link sent! Check your email.', 'success');
                document.getElementById('forgotPasswordFormElement').reset();
                setTimeout(() => this.showLoginForm(), 2000);
            } else {
                this.showAuthMessage(data.message || 'Failed to send reset link', 'error');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showAuthMessage('Network error. Please try again.', 'error');
        }
    }

    async handleLogout() {
        try {
            // Clear stored authentication data and user data
            await chrome.storage.local.remove(['authToken', 'currentUser']);
            await this.clearLocalStorageData(); // Clear all user data
            
            this.authToken = null;
            this.currentUser = null;
            
            // Clear UI
            this.clearProfileForm();
            this.workExperiences = [];
            this.certificates = [];
            this.renderWorkExperiences();
            this.renderCertificates();
            this.hideCoinBalance(); // Hide coin balance on logout
            
            this.showLoginForm();
            this.switchTab('auth');
            this.updateTabAccessibility(); // Update tab access after logout
            this.showAuthMessage('You have been signed out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            this.showAuthMessage('Error signing out. Please try again.', 'error');
        }
    }

    // Helper method to make authenticated API calls
    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.authToken) {
            throw new Error('No authentication token available');
        }

        const authOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(url, authOptions);
        
        if (response.status === 401) {
            // Token expired or invalid
            await this.handleLogout();
            throw new Error('Authentication expired. Please log in again.');
        }

        return response;
    }

    // Authentication status check
    isAuthenticated() {
        return !!(this.authToken && this.currentUser);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Update tab accessibility based on authentication status
    updateTabAccessibility() {
        const protectedTabs = ['profile', 'resume', 'customize', 'versions'];
        const protectedButtons = ['historyBtn', 'versionBtn'];
        const isAuth = this.isAuthenticated();
        
        // Update tab accessibility
        protectedTabs.forEach(tabName => {
            const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
            if (tabBtn) {
                tabBtn.style.opacity = isAuth ? '1' : '0.5';
                tabBtn.style.pointerEvents = isAuth ? 'auto' : 'none';
                tabBtn.title = isAuth ? '' : 'Please log in to access this feature';
            }
        });
        
        // Update header button accessibility (history and version buttons)
        protectedButtons.forEach(buttonId => {
            const btn = document.getElementById(buttonId);
            if (btn) {
                btn.style.opacity = isAuth ? '1' : '0.5';
                btn.style.pointerEvents = isAuth ? 'auto' : 'none';
                btn.title = isAuth ? (buttonId === 'historyBtn' ? 'View customization history' : 'View version history') : 'Please log in to access this feature';
            }
        });
    }

    // Load user-specific data from backend
    async loadUserSpecificData() {
        if (!this.isAuthenticated()) {
            return;
        }

        try {
            // Clear any existing local storage data that might be from other users
            await this.clearLocalStorageData();
            
            // Load user profile from backend
            const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/profile');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.profile) {
                    // Load profile data
                    this.loadProfile(data.profile);
                    
                    // Load work experiences and certificates
                    if (data.profile.workExperience) {
                        this.workExperiences = data.profile.workExperience;
                        this.renderWorkExperiences();
                    } else {
                        this.workExperiences = [];
                        this.renderWorkExperiences();
                    }
                    
                    if (data.profile.certificates) {
                        this.certificates = data.profile.certificates;
                        this.renderCertificates();
                    } else {
                        this.certificates = [];
                        this.renderCertificates();
                    }
                } else {
                    // New user with no profile data
                    this.clearProfileForm();
                    this.workExperiences = [];
                    this.certificates = [];
                    this.renderWorkExperiences();
                    this.renderCertificates();
                }
                
                // Load coin balance and recent transactions
                await this.loadCoinBalance();
                await this.loadRecentTransactions();
            } else {
                console.error('Failed to load profile data');
                this.clearProfileForm();
                this.workExperiences = [];
                this.certificates = [];
                this.renderWorkExperiences();
                this.renderCertificates();
                // Still show coin balance and transactions even if profile fails to load
                await this.loadCoinBalance();
                await this.loadRecentTransactions();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.clearProfileForm();
            this.workExperiences = [];
            this.certificates = [];
            this.renderWorkExperiences();
            this.renderCertificates();
        }
    }

    // Load and display user's coin balance
    async loadCoinBalance() {
        if (!this.isAuthenticated()) {
            this.hideCoinBalance();
            return;
        }

        try {
            const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/coins/balance');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateCoinBalance(data.balance);
                } else {
                    console.error('Failed to load coin balance:', data.error);
                    this.updateCoinBalance(0);
                }
            } else {
                console.error('Failed to fetch coin balance');
                this.updateCoinBalance(0);
            }
        } catch (error) {
            console.error('Error loading coin balance:', error);
            this.updateCoinBalance(0);
        }
    }

    // Update coin balance display
    updateCoinBalance(balance) {
        const coinBalanceElement = document.getElementById('coinBalance');
        const coinAmountElement = document.getElementById('coinAmount');
        const accountCoinBalanceElement = document.getElementById('accountCoinBalance');
        
        if (coinAmountElement) {
            coinAmountElement.textContent = balance;
        }
        
        if (accountCoinBalanceElement) {
            accountCoinBalanceElement.textContent = balance;
        }
        
        if (coinBalanceElement) {
            coinBalanceElement.style.display = 'flex';
        }
    }

    // Hide coin balance display
    hideCoinBalance() {
        const coinBalanceElement = document.getElementById('coinBalance');
        if (coinBalanceElement) {
            coinBalanceElement.style.display = 'none';
        }
    }

    // Load recent coin transactions
    async loadRecentTransactions() {
        if (!this.isAuthenticated()) {
            return;
        }

        try {
            const response = await this.makeAuthenticatedRequest('http://localhost:4003/api/coins/transactions');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayRecentTransactions(data.transactions.slice(0, 5)); // Show last 5 transactions
                }
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }

    // Display recent transactions in the UI
    displayRecentTransactions(transactions) {
        const container = document.getElementById('recentTransactions');
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 16px;">No transactions yet</p>';
            return;
        }

        container.innerHTML = transactions.map(transaction => {
            const date = new Date(transaction.timestamp).toLocaleDateString();
            const isCredit = transaction.type === 'credit';
            const sign = isCredit ? '+' : '-';
            const amountClass = isCredit ? 'positive' : 'negative';
            const typeClass = isCredit ? 'credit' : 'debit';
            
            return `
                <div class="transaction-item">
                    <div>
                        <div class="transaction-type ${typeClass}">
                            ${transaction.type === 'credit' ? '💰 Recharge' : '🤖 AI Usage'}
                        </div>
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-date">${date}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${sign}${transaction.amount} 🪙
                    </div>
                </div>
            `;
        }).join('');
    }

    // Show full transaction history (placeholder for now)
    showTransactionHistory() {
        // This could open a modal or navigate to a dedicated view
        this.showAuthMessage('Full transaction history feature coming soon!', 'info');
    }

    // Handle coin balance click to show transactions
    async showTransactionsFromCoinBalance() {
        if (!this.isAuthenticated()) {
            this.showAuthMessage('Please log in to view transactions', 'error');
            return;
        }
        
        // Switch to Account tab
        this.switchTab('auth');
        
        // Refresh transaction history
        await this.loadRecentTransactions();
        
        // Show coin management section
        const coinManagement = document.getElementById('coinManagement');
        if (coinManagement) {
            coinManagement.style.display = 'block';
            coinManagement.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Clear local storage data to prevent cross-user contamination
    async clearLocalStorageData() {
        await chrome.storage.local.remove([
            'profile', 'workExperiences', 'certificates', 
            'uploadedResume', 'referenceCV', 'resumeVersions', 'customizationHistory'
        ]);
    }

    // Clear profile form for new users
    clearProfileForm() {
        const profileFields = ['name', 'designation', 'email', 'phone', 'address', 'linkedin', 'skills', 'education', 'languages'];
        profileFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = '';
            }
        });
    }

    // Password visibility toggle
    togglePasswordVisibility(inputId) {
        const passwordInput = document.getElementById(inputId);
        const toggleBtn = document.querySelector(`[data-target="${inputId}"]`);
        const eyeIcon = toggleBtn.querySelector('.eye-icon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.textContent = '🙈'; // Closed eye
            toggleBtn.title = 'Hide password';
        } else {
            passwordInput.type = 'password';
            eyeIcon.textContent = '👁️'; // Open eye
            toggleBtn.title = 'Show password';
        }
    }

    // Fallback download method for when Chrome downloads API fails
    triggerDirectDownload(url, filename) {
        try {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('Direct download triggered for:', filename);
        } catch (error) {
            console.error('Direct download failed:', error);
        }
    }
}

// Initialize the application
let resumeCustomizer;
document.addEventListener('DOMContentLoaded', () => {
    resumeCustomizer = new ResumeCustomizer();
    // Make functions available globally for HTML onclick handlers AFTER initialization
    window.resumeCustomizer = resumeCustomizer;
});