const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

/**
 * File Processing Service
 * Handles text extraction from PDFs, images, and text files
 */

class FileProcessor {
  
  /**
   * Process uploaded file and extract text
   */
  async processFile(filePath, mimeType) {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(filePath);
        
        case 'text/plain':
          return await this.extractFromText(filePath);
        
        case 'image/jpeg':
        case 'image/jpg':
        case 'image/png':
        case 'image/webp':
          return await this.extractFromImage(filePath);
        
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('File processing error:', error);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF
   */
  async extractFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);

      return {
        content: data.text,
        metadata: {
          pageCount: data.numpages,
          wordCount: this.countWords(data.text),
          estimatedReadTime: this.calculateReadTime(data.text)
        }
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from plain text file
   */
  async extractFromText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      return {
        content: content,
        metadata: {
          wordCount: this.countWords(content),
          estimatedReadTime: this.calculateReadTime(content)
        }
      };
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractFromImage(filePath) {
    try {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      });

      return {
        content: text,
        metadata: {
          wordCount: this.countWords(text),
          estimatedReadTime: this.calculateReadTime(text),
          extractionMethod: 'OCR'
        }
      };
    } catch (error) {
      throw new Error(`Image OCR failed: ${error.message}`);
    }
  }

  /**
   * Count words in text
   */
  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate estimated reading time (minutes)
   * Average reading speed: 200-250 words per minute
   */
  calculateReadTime(text) {
    const wordCount = this.countWords(text);
    const wordsPerMinute = 225;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Extract key information from content
   */
  extractMetadata(content, originalName) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    return {
      lineCount: lines.length,
      characterCount: content.length,
      wordCount: this.countWords(content),
      estimatedReadTime: this.calculateReadTime(content),
      fileName: originalName,
      hasCode: /```|function |class |const |let |var /.test(content),
      hasMath: /\$.*\$|\\\(.*\\\)|\\\[.*\\\]/.test(content)
    };
  }

  /**
   * Clean and normalize extracted text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep punctuation
      .replace(/[^\w\s.,;:!?()\-'"]/g, '')
      // Trim
      .trim();
  }

  /**
   * Split content into chunks for processing
   * Useful for large documents that need to be processed in parts
   */
  chunkContent(content, maxChunkSize = 2000) {
    const words = content.split(/\s+/);
    const chunks = [];
    
    let currentChunk = [];
    let currentSize = 0;

    for (const word of words) {
      if (currentSize + word.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [word];
        currentSize = word.length;
      } else {
        currentChunk.push(word);
        currentSize += word.length + 1;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  /**
   * Delete file from filesystem
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }
}

module.exports = new FileProcessor();
