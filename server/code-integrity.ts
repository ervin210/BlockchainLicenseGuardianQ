const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { storage } = require('./storage');

/**
 * File Integrity Monitor for detecting unauthorized code deletion or modification
 */
class FileIntegrityMonitor {
  constructor() {
    this.ignorePatterns = [
      '.git', 
      'node_modules', 
      '.cache', 
      'dist',
      '.replit'
    ];
  }

  /**
   * Create a hash of the file contents
   * @param {string} filePath Path to the file
   * @returns {string} SHA-256 hash of the file
   */
  createFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return createHash('sha256').update(content).digest('hex');
    } catch (error) {
      console.error(`Error creating hash for ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Check if a file or directory should be ignored
   * @param {string} pathToCheck Path to check
   * @returns {boolean} True if the path should be ignored
   */
  shouldIgnore(pathToCheck) {
    const basename = path.basename(pathToCheck);
    return this.ignorePatterns.some(pattern => {
      if (pattern.startsWith('*')) {
        const ext = pattern.substring(1);
        return basename.endsWith(ext);
      }
      return basename === pattern || pathToCheck.includes(`/${pattern}/`);
    });
  }

  /**
   * Recursively scan directory and register all files
   * @param {string} directory Directory to scan
   * @param {function} callback Callback for each file found
   */
  async scanDirectory(directory, callback) {
    try {
      const items = fs.readdirSync(directory);
      for (const item of items) {
        const itemPath = path.join(directory, item);
        if (this.shouldIgnore(itemPath)) continue;

        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          await this.scanDirectory(itemPath, callback);
        } else if (stats.isFile()) {
          await callback(itemPath, stats);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${directory}:`, error.message);
    }
  }

  /**
   * Register a file in the database for integrity tracking
   * @param {string} filePath Path to the file
   * @param {object} stats File stats
   */
  async registerFile(filePath, stats) {
    try {
      const fileHash = this.createFileHash(filePath);
      if (!fileHash) return;

      const relativePath = path.relative(process.cwd(), filePath);
      
      // Check if file already exists in DB
      const existingFile = await storage.getFileIntegrity(relativePath);
      
      if (existingFile) {
        // Update if hash changed
        if (existingFile.fileHash !== fileHash || existingFile.size !== stats.size) {
          await storage.updateFileIntegrity(relativePath, {
            fileHash,
            size: stats.size,
            lastModified: stats.mtime,
            status: 'valid'
          });
          console.log(`Updated file integrity record for ${relativePath}`);
        }
      } else {
        // Create new record
        await storage.addFileIntegrity({
          filePath: relativePath,
          fileHash,
          size: stats.size,
          lastModified: stats.mtime
        });
        console.log(`Registered new file for integrity monitoring: ${relativePath}`);
      }
    } catch (error) {
      console.error(`Error registering file ${filePath}:`, error.message);
    }
  }

  /**
   * Check all registered files for modifications or deletions
   */
  async verifyAllFiles() {
    try {
      const files = await storage.getAllFiles();
      const missingFiles = [];
      const modifiedFiles = [];
      
      for (const file of files) {
        const fullPath = path.join(process.cwd(), file.filePath);
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          missingFiles.push(file);
          await storage.markFileAsDeleted(file.filePath);
          continue;
        }
        
        // Check if file modified
        const stats = fs.statSync(fullPath);
        const currentHash = this.createFileHash(fullPath);
        
        if (file.fileHash !== currentHash || file.size !== stats.size) {
          modifiedFiles.push({
            file,
            currentHash,
            currentSize: stats.size
          });
          
          await storage.markFileAsModified(file.filePath, currentHash, stats.size);
        }
      }
      
      return {
        totalFiles: files.length,
        missingFiles,
        modifiedFiles
      };
    } catch (error) {
      console.error('Error verifying files:', error.message);
      return {
        totalFiles: 0,
        missingFiles: [],
        modifiedFiles: [],
        error: error.message
      };
    }
  }

  /**
   * Register all files in the project
   */
  async registerAllFiles() {
    return new Promise((resolve) => {
      this.scanDirectory(process.cwd(), async (filePath, stats) => {
        await this.registerFile(filePath, stats);
      }).then(() => {
        resolve({ success: true });
      });
    });
  }
  
  /**
   * Get a report of deleted files
   */
  async getDeletedFilesReport() {
    try {
      const deletedFiles = await storage.getDeletedFiles();
      return {
        count: deletedFiles.length,
        files: deletedFiles
      };
    } catch (error) {
      console.error('Error getting deleted files:', error.message);
      return {
        count: 0,
        files: [],
        error: error.message
      };
    }
  }
  
  /**
   * Get a report of modified files
   */
  async getModifiedFilesReport() {
    try {
      const modifiedFiles = await storage.getModifiedFiles();
      return {
        count: modifiedFiles.length,
        files: modifiedFiles
      };
    } catch (error) {
      console.error('Error getting modified files:', error.message);
      return {
        count: 0,
        files: [],
        error: error.message
      };
    }
  }
}

// Export the monitor
const fileMonitor = new FileIntegrityMonitor();
module.exports = { fileMonitor };