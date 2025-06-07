-- OMB v3 Database Schema for Cloudflare D1
-- Run with: wrangler d1 execute <DB_NAME> --file=schema.sql

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    odoo_version INTEGER NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, generating, testing, uat, completed, failed
    description TEXT,
    final_price INTEGER, -- Price in cents
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Specifications table
CREATE TABLE specifications (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE,
    content TEXT, -- Markdown content
    is_approved INTEGER DEFAULT 0, -- boolean (0 or 1)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Module builds/versions table
CREATE TABLE module_builds (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    r2_key TEXT NOT NULL, -- Key for the module zip in R2 storage
    build_status TEXT DEFAULT 'building', -- building, completed, failed
    test_results TEXT, -- JSON string with test results
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    UNIQUE(project_id, version)
);

-- Payments table
CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL, -- pending, succeeded, failed
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- User sessions table (for JWT blacklisting if needed)
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Adjustment requests table
CREATE TABLE adjustment_requests (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    request_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    response_text TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Test sessions table
CREATE TABLE test_sessions (
    session_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    status TEXT DEFAULT 'initializing', -- initializing, running, completed, failed, stopped
    progress INTEGER DEFAULT 0,
    current_step TEXT,
    runner_session_id TEXT, -- Session ID from Test Runner service
    results TEXT, -- JSON string with test results
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT FALSE,
    error TEXT,
    started_at TEXT,
    completed_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Test cases table
CREATE TABLE test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL, -- passed, failed, skipped
    duration REAL DEFAULT 0,
    error_message TEXT,
    screenshot_path TEXT,
    trace_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES test_sessions (session_id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_module_builds_project_id ON module_builds(project_id);
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_stripe_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_adjustment_requests_project_id ON adjustment_requests(project_id);
CREATE INDEX idx_test_sessions_project_id ON test_sessions(project_id);
CREATE INDEX idx_test_sessions_status ON test_sessions(status);
CREATE INDEX idx_test_cases_session_id ON test_cases(session_id);
CREATE INDEX idx_test_cases_status ON test_cases(status);

-- UAT Sessions table
CREATE TABLE IF NOT EXISTS uat_sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'initializing', -- 'initializing', 'active', 'expired', 'stopped'
    tunnel_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Project Pricing table
CREATE TABLE IF NOT EXISTS project_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL UNIQUE,
    base_price REAL NOT NULL,
    complexity_score INTEGER NOT NULL,
    final_price REAL NOT NULL,
    pricing_breakdown TEXT, -- JSON string with detailed breakdown
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Enhanced Payments table (if not exists for backward compatibility)
CREATE TABLE IF NOT EXISTS payments_v2 (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    paid_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Module Downloads table (for tracking downloads)
CREATE TABLE IF NOT EXISTS module_downloads (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    module_version_id TEXT NOT NULL, -- References module_builds.id
    downloaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Enhanced Adjustment Requests table (update existing if needed)
CREATE TABLE IF NOT EXISTS adjustment_requests_v2 (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    processed_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Additional indexes for Sprint 5 tables
CREATE INDEX IF NOT EXISTS idx_uat_sessions_project ON uat_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_uat_sessions_user ON uat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_uat_sessions_status ON uat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_project_pricing_project ON project_pricing(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_v2_project ON payments_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_v2_stripe ON payments_v2(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_v2_user ON payments_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_module_downloads_project ON module_downloads(project_id);
CREATE INDEX IF NOT EXISTS idx_module_downloads_user ON module_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_requests_v2_project ON adjustment_requests_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_requests_v2_user ON adjustment_requests_v2(user_id); 