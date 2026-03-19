-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  ip TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('login_failed', 'rate_limit_hit', 'validation_error', 'login_success')),
  error_message TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_created ON audit_logs(ip, created_at);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  last_accessed_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
