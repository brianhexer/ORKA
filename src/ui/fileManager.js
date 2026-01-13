/**
 * File handling UI utilities
 */

export class FileManager {
    /**
     * Download file
     */
    static download(data, filename, mimeType = 'application/octet-stream') {
        const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Generate filename with timestamp
     */
    static generateFilename(baseName, extension) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${baseName}-${timestamp}.${extension}`;
    }
}
