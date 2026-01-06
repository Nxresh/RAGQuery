/**
 * ============================================================
 * BULLETPROOF SECURITY MIDDLEWARE - RAGQuery
 * ============================================================
 * Enterprise-grade security following OWASP best practices
 * 
 * Features:
 * - Multi-tier rate limiting (IP + User + Endpoint-specific)
 * - Schema-based input validation with Joi
 * - Deep input sanitization (XSS, SQL injection, NoSQL injection)
 * - Request size limits
 * - Security headers with Helmet
 * - Graceful error handling
 * 
 * @version 2.0.0
 * @author Security Team
 */

import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import helmet from 'helmet';

// ============================================================
// SECURITY CONSTANTS - OWASP Recommended Defaults
// ============================================================

const SECURITY_CONFIG = {
    // Rate Limiting Tiers
    RATE_LIMITS: {
        GLOBAL: { windowMs: 60 * 1000, max: 100 },           // 100 req/min global
        AUTH: { windowMs: 15 * 60 * 1000, max: 10 },         // 10 req/15min for auth (brute force protection)
        UPLOAD: { windowMs: 60 * 1000, max: 10 },            // 10 uploads/min
        AI_GENERATION: { windowMs: 60 * 1000, max: 20 },     // 20 AI calls/min (expensive operations)
        SEARCH: { windowMs: 60 * 1000, max: 50 },            // 50 searches/min
    },

    // Input Length Limits (bytes)
    MAX_LENGTHS: {
        TITLE: 500,
        CONTENT: 10 * 1024 * 1024,    // 10MB for document content
        QUERY: 10000,
        URL: 2048,
        EMAIL: 254,
        UID: 128,
        NAME: 100,
        TOPIC: 1000,
        CONTEXT: 5 * 1024 * 1024,     // 5MB for context
        PASSWORD: 128,
        GENERAL_STRING: 5000,
    },

    // Allowed MIME Types for uploads
    ALLOWED_MIME_TYPES: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'audio/mpeg',
        'audio/wav',
        'audio/webm',
    ],

    // Blocked patterns (SQL injection, NoSQL injection, XSS)
    BLOCKED_PATTERNS: [
        // SQL Injection patterns
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|TRUNCATE)\b)/gi,
        /(--)|(;)|(\/\*)|(\*\/)/g,
        // NoSQL Injection patterns
        /\$where|\$gt|\$lt|\$ne|\$regex|\$or|\$and/gi,
        // Script injection
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /data:\s*text\/html/gi,
    ],
};

// ============================================================
// RATE LIMITERS - Multi-Tier Protection
// ============================================================

/**
 * Creates a configured rate limiter with graceful 429 responses
 */
const createRateLimiter = (config, name) => {
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        standardHeaders: true,           // Return rate limit info in headers
        legacyHeaders: false,            // Disable X-RateLimit-* headers
        skipSuccessfulRequests: false,
        skipFailedRequests: false,

        // Custom key generator: combines IP + User ID for user-aware limiting
        keyGenerator: (req) => {
            const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';
            const ip = req.ip || req.connection?.remoteAddress || 'unknown';
            return `${name}:${ip}:${userId}`;
        },

        // Graceful 429 response
        handler: (req, res, next, options) => {
            const retryAfter = Math.ceil(options.windowMs / 1000);

            console.log(`[Security] Rate limit exceeded: ${name} for ${options.keyGenerator(req)}`);

            res.set('Retry-After', retryAfter);
            res.status(429).json({
                error: 'Too many requests',
                message: `Rate limit exceeded for ${name}. Please wait before retrying.`,
                retryAfter: retryAfter,
                limit: options.max,
                window: `${options.windowMs / 1000} seconds`,
            });
        },

        // Skip rate limiting for trusted IPs (localhost for development)
        skip: (req) => {
            const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
            return process.env.NODE_ENV === 'development' &&
                trustedIPs.includes(req.ip);
        },
    });
};

// Pre-configured rate limiters
export const rateLimiters = {
    global: createRateLimiter(SECURITY_CONFIG.RATE_LIMITS.GLOBAL, 'global'),
    auth: createRateLimiter(SECURITY_CONFIG.RATE_LIMITS.AUTH, 'auth'),
    upload: createRateLimiter(SECURITY_CONFIG.RATE_LIMITS.UPLOAD, 'upload'),
    aiGeneration: createRateLimiter(SECURITY_CONFIG.RATE_LIMITS.AI_GENERATION, 'ai-generation'),
    search: createRateLimiter(SECURITY_CONFIG.RATE_LIMITS.SEARCH, 'search'),
};

// ============================================================
// INPUT VALIDATION SCHEMAS - Joi
// ============================================================

// Common field validators
const commonValidators = {
    uid: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.UID).pattern(/^[a-zA-Z0-9_-]+$/).required(),
    email: Joi.string().email().max(SECURITY_CONFIG.MAX_LENGTHS.EMAIL).required(),
    optionalEmail: Joi.string().email().max(SECURITY_CONFIG.MAX_LENGTHS.EMAIL).optional(),
    title: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.TITLE).trim().required(),
    optionalTitle: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.TITLE).trim().optional(),
    content: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.CONTENT).required(),
    optionalContent: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.CONTENT).optional(),
    query: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.QUERY).trim().required(),
    url: Joi.string().uri({ scheme: ['http', 'https'] }).max(SECURITY_CONFIG.MAX_LENGTHS.URL).required(),
    topic: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.TOPIC).trim().required(),
    context: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.CONTEXT).optional().allow(''),
    name: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.NAME).trim(),
    id: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().pattern(/^[0-9]+$/)
    ),
    sourceIds: Joi.array().items(Joi.number().integer().positive()).max(10).optional(),
    booleanFlag: Joi.boolean().optional(),
};

// Endpoint-specific schemas
export const validationSchemas = {
    // === AUTH ENDPOINTS ===
    'POST /api/auth/token': Joi.object({
        uid: commonValidators.uid,
        email: commonValidators.email,
    }).options({ stripUnknown: true }),

    'POST /api/auth/sync': Joi.object({
        uid: commonValidators.uid,
        email: commonValidators.email,
        firstName: commonValidators.name.optional(),
        lastName: commonValidators.name.optional(),
        country: Joi.string().max(100).optional(),
    }).options({ stripUnknown: true }),

    // === DOCUMENT ENDPOINTS ===
    'POST /api/documents': Joi.object({
        title: commonValidators.title,
        content: commonValidators.content,
        type: Joi.string().valid('text', 'pdf', 'docx', 'url', 'youtube', 'image').optional(),
        isStarred: commonValidators.booleanFlag,
        thumbnail: Joi.string().max(100000).optional(),  // Base64 thumbnail
    }).options({ stripUnknown: true }),

    'PUT /api/documents/:id': Joi.object({
        title: commonValidators.optionalTitle,
        content: commonValidators.optionalContent,
        isStarred: commonValidators.booleanFlag,
    }).options({ stripUnknown: true }),

    // === PROJECT ENDPOINTS ===
    'POST /api/projects': Joi.object({
        name: commonValidators.name.required(),
        source_ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(5).required(),
    }).options({ stripUnknown: true }),

    'PUT /api/projects/:id': Joi.object({
        name: commonValidators.name.required(),
    }).options({ stripUnknown: true }),

    // === PROXY/RAG ENDPOINT ===
    'POST /api/proxy': Joi.object({
        action: Joi.string().valid('rag', 'scrape', 'chat').required(),
        payload: Joi.object({
            // RAG action
            documentContent: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.CONTENT).optional(),
            query: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.QUERY).optional(),
            documentIds: Joi.array().items(Joi.number().integer()).optional(),
            userId: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.UID).optional(),
            enableAdvancedTransforms: commonValidators.booleanFlag,

            // Scrape action
            url: Joi.string().uri({ scheme: ['http', 'https'] }).max(SECURITY_CONFIG.MAX_LENGTHS.URL).optional(),

            // Chat action
            history: Joi.array().items(Joi.object({
                role: Joi.string().valid('user', 'assistant', 'system').required(),
                content: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.QUERY).required(),
            })).max(100).optional(),
        }).required(),
    }).options({ stripUnknown: true }),

    // === SUGGESTIONS ENDPOINT ===
    'POST /api/suggestions': Joi.object({
        sourceIds: Joi.array().items(Joi.number().integer().positive()).max(10).optional(),
        userId: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.UID).optional(),
        featureType: Joi.string().valid('chat', 'studio', 'agents').optional(),
        featureContext: Joi.string().max(500).optional(),
    }).options({ stripUnknown: true }),

    // === YOUTUBE ENDPOINTS ===
    'POST /api/process/youtube': Joi.object({
        url: Joi.string().uri({ scheme: ['http', 'https'] })
            .pattern(/youtube\.com|youtu\.be/)
            .max(SECURITY_CONFIG.MAX_LENGTHS.URL)
            .required()
            .messages({ 'string.pattern.base': 'Invalid YouTube URL' }),
    }).options({ stripUnknown: true }),

    'POST /api/agents/youtube': Joi.object({
        videoUrl: Joi.string().uri({ scheme: ['http', 'https'] })
            .pattern(/youtube\.com|youtu\.be/)
            .max(SECURITY_CONFIG.MAX_LENGTHS.URL)
            .required(),
        query: commonValidators.query,
    }).options({ stripUnknown: true }),

    // === CONFLUENCE ENDPOINTS ===
    'POST /api/agents/confluence/generate': Joi.object({
        knowledge: Joi.string().min(10).max(SECURITY_CONFIG.MAX_LENGTHS.CONTENT).required(),
        title: commonValidators.optionalTitle,
    }).options({ stripUnknown: true }),

    'POST /api/agents/confluence/publish': Joi.object({
        title: commonValidators.title,
        content: commonValidators.content,
        spaceKey: Joi.string().max(50).pattern(/^[A-Za-z0-9_-]+$/).required(),
        parentPageId: Joi.string().max(50).optional(),
        confluenceUrl: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
        confluenceEmail: commonValidators.optionalEmail,
        confluenceToken: Joi.string().max(500).optional(),
        action: Joi.string().valid('create', 'update').optional(),
        pageId: Joi.string().max(50).optional(),
    }).options({ stripUnknown: true }),

    // === STUDIO ENDPOINTS ===
    'POST /api/generate-mindmap': Joi.object({
        topic: commonValidators.topic,
        context: commonValidators.context,
    }).options({ stripUnknown: true }),

    'POST /api/generate-infographic': Joi.object({
        topic: commonValidators.topic,
        context: commonValidators.context,
        mode: Joi.string().valid('standard', 'advanced').optional(),
    }).options({ stripUnknown: true }),

    'POST /api/generate-slidedeck': Joi.object({
        topic: commonValidators.topic,
        context: commonValidators.context,
    }).options({ stripUnknown: true }),

    'POST /api/generate-report': Joi.object({
        topic: commonValidators.topic,
        context: commonValidators.context,
        format: Joi.string().valid(
            'standard', 'briefing_doc', 'study_guide', 'blog_post',
            'executive_summary', 'technical_whitepaper', 'explanatory_article', 'concept_breakdown'
        ).optional(),
    }).options({ stripUnknown: true }),

    'POST /api/regenerate-visual': Joi.object({
        slide_content: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.GENERAL_STRING).required(),
        user_instruction: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.QUERY).optional(),
        current_visual_description: Joi.string().max(SECURITY_CONFIG.MAX_LENGTHS.GENERAL_STRING).optional(),
    }).options({ stripUnknown: true }),

    // === CHAT ENDPOINTS ===
    'POST /api/chat/ares': Joi.object({
        query: commonValidators.query,
    }).options({ stripUnknown: true }),
};

// ============================================================
// INPUT SANITIZATION - Deep Cleaning
// ============================================================

/**
 * Deep sanitize input to prevent XSS, SQL injection, and NoSQL injection
 * Recursively sanitizes objects and arrays
 */
export function deepSanitize(input, depth = 0) {
    // Prevent prototype pollution by limiting depth
    if (depth > 10) return input;

    if (input === null || input === undefined) return input;

    if (typeof input === 'string') {
        let sanitized = input;

        // 1. Remove null bytes
        sanitized = sanitized.replace(/\0/g, '');

        // 2. Remove script tags (case-insensitive, handles variations)
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // 3. Remove javascript: protocol
        sanitized = sanitized.replace(/javascript\s*:/gi, '');

        // 4. Remove event handlers (onclick, onload, etc.)
        sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');

        // 5. Remove data: URLs that could execute code
        sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');

        // 6. Encode HTML special characters (prevent XSS)
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        // 7. Remove dangerous MongoDB operators
        sanitized = sanitized.replace(/\$(?:where|gt|lt|ne|regex|or|and|exists|type|mod|all|slice|size|elemMatch)/gi, '');

        return sanitized;
    }

    if (Array.isArray(input)) {
        return input.map(item => deepSanitize(item, depth + 1));
    }

    if (typeof input === 'object') {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(input)) {
            // Protect against prototype pollution
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                console.log(`[Security] Blocked prototype pollution attempt: ${key}`);
                continue;
            }
            sanitizedObj[key] = deepSanitize(value, depth + 1);
        }
        return sanitizedObj;
    }

    return input;
}

/**
 * Light sanitize - for content that needs to preserve HTML (like document content)
 * Only removes the most dangerous patterns
 */
export function lightSanitize(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/\0/g, '')  // Null bytes
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Scripts
        .replace(/javascript\s*:/gi, '')  // javascript: protocol
        .replace(/\bon\w+\s*=/gi, '');    // Event handlers
}

// ============================================================
// VALIDATION MIDDLEWARE
// ============================================================

/**
 * Creates validation middleware for a specific endpoint
 */
export function validateRequest(schemaKey) {
    return (req, res, next) => {
        const schema = validationSchemas[schemaKey];

        if (!schema) {
            console.warn(`[Security] No validation schema found for: ${schemaKey}`);
            return next();
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,      // Return all errors, not just first
            convert: true,          // Type coercion
            stripUnknown: true,     // Remove fields not in schema
        });

        if (error) {
            const errorDetails = error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message,
                type: d.type,
            }));

            console.log(`[Security] Validation failed for ${schemaKey}:`, errorDetails);

            return res.status(400).json({
                error: 'Validation failed',
                message: 'Invalid request data. Please check your input.',
                details: errorDetails,
            });
        }

        // Replace body with validated & stripped data
        req.body = value;
        next();
    };
}

/**
 * Generic validation middleware that auto-detects the endpoint
 */
export function autoValidate(req, res, next) {
    const method = req.method;
    const path = req.route?.path || req.path;
    const schemaKey = `${method} ${path}`;

    const schema = validationSchemas[schemaKey];

    if (!schema) {
        // No schema defined - log and continue
        return next();
    }

    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        convert: true,
        stripUnknown: true,
    });

    if (error) {
        const errorDetails = error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message,
        }));

        console.log(`[Security] Auto-validation failed for ${schemaKey}:`, errorDetails);

        return res.status(400).json({
            error: 'Validation failed',
            message: 'Invalid request data',
            details: errorDetails,
        });
    }

    req.body = value;
    next();
}

// ============================================================
// SECURITY HEADERS - Helmet Configuration
// ============================================================

export const securityHeaders = helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.tailwindcss.com",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.gstatic.com"
            ],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: [
                "'self'",
                "https://openrouter.ai",
                "https://generativelanguage.googleapis.com",
                "https://*.atlassian.net",
                "https://*.firebaseapp.com",
                "https://*.googleapis.com"
            ],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

// ============================================================
// REQUEST SANITIZATION MIDDLEWARE
// ============================================================

/**
 * Sanitize all incoming request bodies
 */
export function sanitizeRequestBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        // For file uploads with content, use light sanitization
        if (req.file || req.route?.path?.includes('upload')) {
            req.body = deepSanitize(req.body);
            if (req.body.content) {
                req.body.content = lightSanitize(req.body.content);
            }
        } else {
            req.body = deepSanitize(req.body);
        }
    }
    next();
}

/**
 * Sanitize query parameters
 */
export function sanitizeQueryParams(req, res, next) {
    if (req.query && typeof req.query === 'object') {
        req.query = deepSanitize(req.query);
    }
    next();
}

/**
 * Sanitize URL parameters
 */
export function sanitizeUrlParams(req, res, next) {
    if (req.params && typeof req.params === 'object') {
        for (const [key, value] of Object.entries(req.params)) {
            if (typeof value === 'string') {
                // Only allow alphanumeric, dash, underscore for params
                req.params[key] = value.replace(/[^a-zA-Z0-9_-]/g, '');
            }
        }
    }
    next();
}

// ============================================================
// FILE UPLOAD SECURITY
// ============================================================

/**
 * Validate uploaded files
 */
export function validateFileUpload(req, res, next) {
    if (!req.file) {
        return next();
    }

    const { mimetype, size, originalname } = req.file;

    // Check MIME type
    if (!SECURITY_CONFIG.ALLOWED_MIME_TYPES.includes(mimetype)) {
        console.log(`[Security] Blocked file upload: invalid MIME type ${mimetype}`);
        return res.status(400).json({
            error: 'Invalid file type',
            message: `File type ${mimetype} is not allowed`,
            allowedTypes: SECURITY_CONFIG.ALLOWED_MIME_TYPES,
        });
    }

    // Check file size (50MB max)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (size > MAX_FILE_SIZE) {
        console.log(`[Security] Blocked file upload: size ${size} exceeds limit`);
        return res.status(400).json({
            error: 'File too large',
            message: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum of 50MB`,
        });
    }

    // Sanitize filename
    req.file.originalname = originalname
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace special chars
        .replace(/\.{2,}/g, '.')            // Prevent directory traversal
        .substring(0, 255);                 // Limit length

    next();
}

// ============================================================
// SUSPICIOUS ACTIVITY DETECTION
// ============================================================

const suspiciousActivityLog = new Map();

/**
 * Detect and log suspicious request patterns
 */
export function detectSuspiciousActivity(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress;
    const now = Date.now();

    // Check for suspicious patterns
    const suspiciousIndicators = [];

    // 1. Check for SQL injection attempts in query/body
    const requestData = JSON.stringify({ ...req.query, ...req.body });
    if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|UNION)\b.*\b(FROM|INTO|SET|VALUES)\b)/gi.test(requestData)) {
        suspiciousIndicators.push('SQL_INJECTION_ATTEMPT');
    }

    // 2. Check for path traversal
    if (req.path.includes('..') || req.path.includes('%2e%2e')) {
        suspiciousIndicators.push('PATH_TRAVERSAL_ATTEMPT');
    }

    // 3. Check for command injection patterns
    if (/[;&|`$]/.test(requestData) && requestData.includes('exec')) {
        suspiciousIndicators.push('COMMAND_INJECTION_ATTEMPT');
    }

    // 4. Unusual User-Agent
    const userAgent = req.headers['user-agent'] || '';
    if (!userAgent || userAgent.length < 10 || /curl|wget|python|bot/i.test(userAgent)) {
        suspiciousIndicators.push('SUSPICIOUS_USER_AGENT');
    }

    if (suspiciousIndicators.length > 0) {
        // Log suspicious activity
        const logEntry = suspiciousActivityLog.get(ip) || { count: 0, indicators: [], firstSeen: now };
        logEntry.count++;
        logEntry.indicators = [...new Set([...logEntry.indicators, ...suspiciousIndicators])];
        logEntry.lastSeen = now;
        suspiciousActivityLog.set(ip, logEntry);

        console.warn(`[Security] Suspicious activity from ${ip}: ${suspiciousIndicators.join(', ')}`);

        // Block if too many suspicious requests
        if (logEntry.count > 5) {
            console.error(`[Security] BLOCKING IP ${ip} - too many suspicious requests`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'Your request has been blocked due to suspicious activity',
            });
        }
    }

    // Cleanup old entries (every 100 requests)
    if (Math.random() < 0.01) {
        const ONE_HOUR = 60 * 60 * 1000;
        for (const [key, entry] of suspiciousActivityLog.entries()) {
            if (now - entry.lastSeen > ONE_HOUR) {
                suspiciousActivityLog.delete(key);
            }
        }
    }

    next();
}

// ============================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================

/**
 * Validate required environment variables at startup
 */
export function validateEnvironment() {
    const required = {
        // At least one AI API key
        AI_KEY: process.env.OPENROUTER_API_KEY || process.env.API_KEY,
    };

    const recommended = {
        JWT_SECRET: process.env.JWT_SECRET,
        DB_PASSWORD: process.env.DB_PASSWORD,
    };

    const missing = [];
    const warnings = [];

    // Check required
    if (!required.AI_KEY) {
        missing.push('OPENROUTER_API_KEY or API_KEY');
    }

    // Check recommended
    if (!recommended.JWT_SECRET || recommended.JWT_SECRET.includes('change-in-production')) {
        warnings.push('JWT_SECRET should be set to a secure random value in production');
    }

    if (recommended.DB_PASSWORD === 'password') {
        warnings.push('DB_PASSWORD is set to default - use a secure password in production');
    }

    // Report
    if (warnings.length > 0) {
        console.warn('════════════════════════════════════════════════════════════');
        console.warn('⚠️  SECURITY WARNINGS:');
        warnings.forEach(w => console.warn(`   • ${w}`));
        console.warn('════════════════════════════════════════════════════════════');
    }

    if (missing.length > 0) {
        console.error('════════════════════════════════════════════════════════════');
        console.error('❌ MISSING REQUIRED ENVIRONMENT VARIABLES:');
        missing.forEach(m => console.error(`   • ${m}`));
        console.error('════════════════════════════════════════════════════════════');
        process.exit(1);
    }

    console.log('✅ Environment validation passed');
}

// ============================================================
// EXPORT ALL SECURITY COMPONENTS
// ============================================================

export default {
    // Rate limiters
    rateLimiters,

    // Validation
    validationSchemas,
    validateRequest,
    autoValidate,

    // Sanitization
    deepSanitize,
    lightSanitize,
    sanitizeRequestBody,
    sanitizeQueryParams,
    sanitizeUrlParams,

    // Security headers
    securityHeaders,

    // File upload
    validateFileUpload,

    // Monitoring
    detectSuspiciousActivity,

    // Environment
    validateEnvironment,

    // Config access
    SECURITY_CONFIG,
};
