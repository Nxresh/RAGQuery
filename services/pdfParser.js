/**
 * Enhanced PDF Parser with Page-Level Metadata Extraction
 * Provides enterprise-grade provenance tracking for PDFs
 */

import { createRequire } from 'module';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Parse PDF with page-level metadata extraction
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Object} Parsed document with page metadata
 */
export async function parsePDFWithMetadata(buffer) {
    const startTime = Date.now();

    // Generate file hash for integrity tracking
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Parse PDF with page-by-page rendering
    const options = {
        // Custom page renderer to track page boundaries
        pagerender: pageData => {
            return pageData.getTextContent().then(textContent => {
                return textContent.items.map(item => item.str).join(' ');
            });
        }
    };

    const data = await pdf(buffer, options);

    // Split content by page markers (pdf-parse includes form feed characters)
    const pageTexts = splitByPages(data.text, data.numpages);

    // Create chunks with page metadata
    const chunks = [];
    let charOffset = 0;

    for (let pageNum = 1; pageNum <= pageTexts.length; pageNum++) {
        const pageText = pageTexts[pageNum - 1];
        if (!pageText || pageText.trim().length < 10) continue;

        // Split page into paragraphs/sections
        const sections = extractSections(pageText, pageNum);

        for (const section of sections) {
            chunks.push({
                chunkIndex: chunks.length,
                chunkText: section.text,
                pageNumber: pageNum,
                sectionId: section.sectionId,
                startChar: charOffset,
                endChar: charOffset + section.text.length,
                boundingBox: null // Would need pdfjs-dist for coordinates
            });
            charOffset += section.text.length + 1;
        }
    }

    return {
        content: data.text,
        pageCount: data.numpages,
        fileHash,
        metadata: {
            title: data.info?.Title || null,
            author: data.info?.Author || null,
            creator: data.info?.Creator || null,
            creationDate: data.info?.CreationDate || null,
            modificationDate: data.info?.ModDate || null,
            keywords: data.info?.Keywords || null
        },
        chunks,
        processingTimeMs: Date.now() - startTime
    };
}

/**
 * Split text content by page boundaries
 * pdf-parse uses form feed character (\f) between pages
 */
function splitByPages(text, numPages) {
    // Try splitting by form feed first
    let pages = text.split('\f');

    // If that doesn't work, estimate page boundaries by character count
    if (pages.length < numPages) {
        const avgCharsPerPage = Math.ceil(text.length / numPages);
        pages = [];
        for (let i = 0; i < numPages; i++) {
            const start = i * avgCharsPerPage;
            const end = Math.min((i + 1) * avgCharsPerPage, text.length);
            pages.push(text.slice(start, end));
        }
    }

    return pages;
}

/**
 * Extract sections from page text
 * Identifies headers, clauses, and paragraphs
 */
function extractSections(pageText, pageNum) {
    const sections = [];
    const paragraphs = pageText.split(/\n\s*\n/).filter(p => p.trim().length > 20);

    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i].trim();

        // Try to identify section/clause IDs
        const sectionMatch = para.match(/^(\d+\.[\d.]*|\§\s*\d+|Article\s+\d+|Section\s+\d+|Clause\s+\d+)/i);
        const sectionId = sectionMatch
            ? `page${pageNum}_${sectionMatch[1].replace(/\s+/g, '_')}`
            : `page${pageNum}_para${i + 1}`;

        sections.push({
            text: para,
            sectionId
        });
    }

    // If no paragraphs found, treat whole page as one section
    if (sections.length === 0 && pageText.trim().length > 0) {
        sections.push({
            text: pageText.trim(),
            sectionId: `page${pageNum}_full`
        });
    }

    return sections;
}

/**
 * Generate version ID for document tracking
 */
export function generateVersionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `v${timestamp}-${random}`;
}

/**
 * Parse DOCX with metadata (wrapper for mammoth)
 */
export async function parseDocxWithMetadata(buffer) {
    const mammoth = require('mammoth');
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    // Create simple chunks from paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    const chunks = paragraphs.map((para, idx) => ({
        chunkIndex: idx,
        chunkText: para.trim(),
        pageNumber: null, // DOCX doesn't have native page numbers
        sectionId: `section_${idx + 1}`,
        startChar: 0,
        endChar: para.length,
        boundingBox: null
    }));

    return {
        content: text,
        pageCount: null,
        fileHash,
        metadata: {},
        chunks,
        processingTimeMs: 0
    };
}

/**
 * Parse plain text with metadata
 */
export function parseTextWithMetadata(text, filename) {
    const fileHash = crypto.createHash('sha256').update(text).digest('hex');

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    const chunks = paragraphs.map((para, idx) => ({
        chunkIndex: idx,
        chunkText: para.trim(),
        pageNumber: null,
        sectionId: `section_${idx + 1}`,
        startChar: 0,
        endChar: para.length,
        boundingBox: null
    }));

    return {
        content: text,
        pageCount: null,
        fileHash,
        metadata: { filename },
        chunks,
        processingTimeMs: 0
    };
}
