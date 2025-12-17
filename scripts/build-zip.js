#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class ExtensionBuilder {
    constructor() {
        this.basePath = path.join(__dirname, '..');
        this.buildPath = path.join(this.basePath, 'dist');
    }

    async build() {
        console.log('📦 Building Chrome extension for distribution...\n');

        try {
            await this.createBuildDirectory();
            await this.copyFiles();
            await this.createZip();
            
            console.log('🎉 Extension built successfully!');
            console.log(`📁 Output: ${path.join(this.buildPath, 'extension.zip')}`);
            
        } catch (error) {
            console.error('❌ Build failed:', error.message);
            process.exit(1);
        }
    }

    async createBuildDirectory() {
        if (fs.existsSync(this.buildPath)) {
            fs.rmSync(this.buildPath, { recursive: true });
        }
        fs.mkdirSync(this.buildPath, { recursive: true });
        console.log('✅ Created build directory');
    }

    async copyFiles() {
        console.log('📋 Copying extension files...');

        const filesToCopy = [
            'manifest.json',
            'popup/',
            'content/',
            'background/',
            'icons/',
            'assets/'
        ];

        const excludePatterns = [
            'node_modules',
            '.git',
            'backend',
            'scripts',
            'package.json',
            'README.md',
            '.env',
            'dist'
        ];

        for (const item of filesToCopy) {
            const sourcePath = path.join(this.basePath, item);
            const destPath = path.join(this.buildPath, item);

            if (fs.existsSync(sourcePath)) {
                const stats = fs.statSync(sourcePath);
                
                if (stats.isDirectory()) {
                    await this.copyDirectory(sourcePath, destPath, excludePatterns);
                } else {
                    await this.copyFile(sourcePath, destPath);
                }
                
                console.log(`  ✅ Copied ${item}`);
            } else {
                console.log(`  ⚠️  Skipped ${item} (not found)`);
            }
        }
    }

    async copyDirectory(source, dest, excludePatterns = []) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const items = fs.readdirSync(source);

        for (const item of items) {
            if (excludePatterns.some(pattern => item.includes(pattern))) {
                continue;
            }

            const sourcePath = path.join(source, item);
            const destPath = path.join(dest, item);
            const stats = fs.statSync(sourcePath);

            if (stats.isDirectory()) {
                await this.copyDirectory(sourcePath, destPath, excludePatterns);
            } else {
                await this.copyFile(sourcePath, destPath);
            }
        }
    }

    async copyFile(source, dest) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(source, dest);
    }

    async createZip() {
        console.log('🗜️  Creating ZIP archive...');

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(path.join(this.buildPath, 'extension.zip'));
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`✅ ZIP created successfully (${sizeInMB} MB)`);
                resolve();
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // Add all files from build directory except the zip itself
            const items = fs.readdirSync(this.buildPath);
            for (const item of items) {
                if (item === 'extension.zip') continue;

                const itemPath = path.join(this.buildPath, item);
                const stats = fs.statSync(itemPath);

                if (stats.isDirectory()) {
                    archive.directory(itemPath, item);
                } else {
                    archive.file(itemPath, { name: item });
                }
            }

            archive.finalize();
        });
    }

    validateBeforeBuild() {
        // Check if manifest.json exists
        const manifestPath = path.join(this.basePath, 'manifest.json');
        if (!fs.existsSync(manifestPath)) {
            throw new Error('manifest.json not found');
        }

        // Validate manifest.json
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            if (!manifest.name || !manifest.version || !manifest.manifest_version) {
                throw new Error('Invalid manifest.json - missing required fields');
            }
        } catch (error) {
            throw new Error(`Invalid manifest.json: ${error.message}`);
        }

        // Check required files
        const requiredFiles = [
            'popup/popup.html',
            'popup/popup.js',
            'popup/popup.css'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(this.basePath, file))) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        console.log('✅ Pre-build validation passed');
    }

    async generateManifest() {
        const manifestPath = path.join(this.basePath, 'manifest.json');
        const buildManifestPath = path.join(this.buildPath, 'manifest.json');
        
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Remove development-only fields
        delete manifest.key;
        
        // Update version if needed
        const now = new Date();
        const buildNumber = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`;
        
        if (manifest.version.endsWith('-dev')) {
            manifest.version = manifest.version.replace('-dev', '');
        }
        
        fs.writeFileSync(buildManifestPath, JSON.stringify(manifest, null, 2));
        console.log('✅ Generated production manifest.json');
    }
}

// Build the extension
const builder = new ExtensionBuilder();

// Validate before building
try {
    builder.validateBeforeBuild();
} catch (error) {
    console.error('❌ Pre-build validation failed:', error.message);
    process.exit(1);
}

builder.build();