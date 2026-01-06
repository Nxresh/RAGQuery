-- Create Database (Run this line separately first if DB doesn't exist)
-- CREATE DATABASE ragquery_db;

-- Connect to the database before running the rest!

-- Users Table (Firebase Auth Mapping)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    country VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User Details Table (Detailed Profile)
CREATE TABLE IF NOT EXISTS user_details (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    country VARCHAR(255),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table (Enhanced with provenance metadata)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    type VARCHAR(50),
    user_id VARCHAR(255), -- Stores firebase_uid
    version_id VARCHAR(50), -- For version tracking
    file_hash VARCHAR(64), -- SHA-256 hash for integrity
    page_count INTEGER, -- Total pages in document
    metadata JSONB DEFAULT '{}', -- Additional metadata (author, created date, etc.)
    is_starred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Document Chunks Table (Granular provenance tracking)
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    page_number INTEGER, -- Which page this chunk came from
    section_id VARCHAR(100), -- Section/clause identifier
    start_char INTEGER, -- Character offset start
    end_char INTEGER, -- Character offset end
    bounding_box JSONB, -- {x, y, width, height} for PDF coords
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table (Compliance audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    query_text TEXT NOT NULL,
    retrieved_chunk_ids INTEGER[], -- All chunks retrieved
    chunks_fed_to_model INTEGER[], -- Chunks actually sent to LLM
    cited_chunk_ids INTEGER[], -- Chunks cited in response
    model_response TEXT, -- Full LLM response
    document_ids INTEGER[], -- Source documents involved
    latency_ms INTEGER, -- Query processing time
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_ids JSONB NOT NULL, -- Stores array of document IDs (JSONB is better in Postgres)
    user_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_page_number ON document_chunks(page_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Note: Run this script in pgAdmin Query Tool or via psql.
