#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ExtensionValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.basePath = path.join(__dirname, '..');
    }

    validate() {
        console.log('🔍 Validating Chrome extension...\n');

        this.validateManifest();
        this.validateFiles();
        this.validateFileStructure();
        this.validateCSP();

        this.printResults();
        return this.errors.length === 0;
    }

    validateManifest() {
        console.log('📋 Validating manifest.json...');
        
        const manifestPath = path.join(this.basePath, 'manifest.json');
        
        if (!fs.existsSync(manifestPath)) {
            this.errors.push('manifest.json is missing');
            return;
        }

        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // Required fields
            const required = ['manifest_version', 'name', 'version'];
            required.forEach(field => {
                if (!manifest[field]) {
                    this.errors.push(`manifest.json missing required field: ${field}`);
                }
            });

            // Manifest version should be 3
            if (manifest.manifest_version !== 3) {
                this.errors.push('manifest_version should be 3 for Chrome Extensions Manifest V3');
            }

            // Validate permissions
            if (manifest.permissions) {
                const dangerousPermissions = ['<all_urls>', 'tabs', 'history'];
                dangerousPermissions.forEach(perm => {
                    if (manifest.permissions.includes(perm)) {
                        this.warnings.push(`Potentially sensitive permission: ${perm}`);
                    }
                });
            }

            // Validate icons
            if (manifest.icons) {
                Object.values(manifest.icons).forEach(iconPath => {
                    if (!fs.existsSync(path.join(this.basePath, iconPath))) {
                        this.warnings.push(`Missing icon: ${iconPath}`);
                    }
                });
            }

            console.log('✅ Manifest validation completed\n');

        } catch (error) {
            this.errors.push(`Invalid JSON in manifest.json: ${error.message}`);
        }
    }

    validateFiles() {
        console.log('📁 Validating extension files...');

        const requiredFiles = [
            'popup/popup.html',
            'popup/popup.css',
            'popup/popup.js',
            'content/content.js',
            'background/background.js'
        ];

        requiredFiles.forEach(filePath => {
            const fullPath = path.join(this.basePath, filePath);
            if (!fs.existsSync(fullPath)) {
                this.errors.push(`Missing required file: ${filePath}`);
            } else {
                // Check if file is not empty
                const stats = fs.statSync(fullPath);
                if (stats.size === 0) {
                    this.warnings.push(`Empty file: ${filePath}`);
                }
            }
        });

        console.log('✅ File validation completed\n');
    }

    validateFileStructure() {
        console.log('🏗️  Validating file structure...');

        const expectedDirs = ['popup', 'content', 'background', 'icons'];
        
        expectedDirs.forEach(dir => {
            const dirPath = path.join(this.basePath, dir);
            if (!fs.existsSync(dirPath)) {
                this.errors.push(`Missing directory: ${dir}`);
            }
        });

        // Check for common mistakes
        const commonMistakes = [
            { file: 'popup.html', correctPath: 'popup/popup.html' },
            { file: 'content.js', correctPath: 'content/content.js' },
            { file: 'background.js', correctPath: 'background/background.js' }
        ];

        commonMistakes.forEach(mistake => {
            if (fs.existsSync(path.join(this.basePath, mistake.file))) {
                this.warnings.push(`File in wrong location: ${mistake.file} should be at ${mistake.correctPath}`);
            }
        });

        console.log('✅ File structure validation completed\n');
    }

    validateCSP() {
        console.log('🔒 Validating Content Security Policy...');

        // Check popup HTML for inline scripts/styles
        const popupPath = path.join(this.basePath, 'popup/popup.html');
        if (fs.existsSync(popupPath)) {
            const popupContent = fs.readFileSync(popupPath, 'utf8');
            
            if (popupContent.includes('<script>') || popupContent.includes('onclick=')) {
                this.errors.push('Popup HTML contains inline scripts which violate CSP');
            }
            
            if (popupContent.includes('style=')) {
                this.warnings.push('Popup HTML contains inline styles which may violate CSP');
            }
        }

        console.log('✅ CSP validation completed\n');
    }

    validateSecurity() {
        console.log('🛡️  Validating security...');

        // Check for potential security issues
        const jsFiles = [
            'popup/popup.js',
            'content/content.js',
            'background/background.js'
        ];

        jsFiles.forEach(filePath => {
            const fullPath = path.join(this.basePath, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Check for eval usage
                if (content.includes('eval(')) {
                    this.errors.push(`Security issue: eval() usage in ${filePath}`);
                }
                
                // Check for innerHTML with user input
                if (content.includes('.innerHTML') && content.includes('req.')) {
                    this.warnings.push(`Potential XSS risk: innerHTML usage in ${filePath}`);
                }
                
                // Check for external script loading
                if (content.includes('document.createElement("script")')) {
                    this.warnings.push(`Dynamic script loading detected in ${filePath}`);
                }
            }
        });

        console.log('✅ Security validation completed\n');
    }

    printResults() {
        console.log('📊 Validation Results:');
        console.log('='.repeat(50));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 All validations passed! Extension is ready for packaging.');
        } else {
            if (this.errors.length > 0) {
                console.log('\n❌ ERRORS:');
                this.errors.forEach((error, index) => {
                    console.log(`${index + 1}. ${error}`);
                });
            }

            if (this.warnings.length > 0) {
                console.log('\n⚠️  WARNINGS:');
                this.warnings.forEach((warning, index) => {
                    console.log(`${index + 1}. ${warning}`);
                });
            }
        }

        console.log('\n' + '='.repeat(50));
        
        if (this.errors.length > 0) {
            console.log('❌ Validation FAILED. Please fix errors before packaging.');
            process.exit(1);
        } else {
            console.log('✅ Validation PASSED. Extension is ready!');
        }
    }
}

// Run validation
const validator = new ExtensionValidator();
validator.validate();