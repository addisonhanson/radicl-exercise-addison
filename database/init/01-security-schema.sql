-- ============================================
-- Security Dashboard Schema
-- ============================================
-- Tables, constraints, indexes and triggers for the security operations
-- dashboard. Seed data lives in 02-security-seed.sql.
--
-- Postgres only runs files in docker-entrypoint-initdb.d against an EMPTY
-- data volume. To apply changes to this file locally:
--   docker compose down -v && docker compose up -d
-- ============================================

-- ============================================
-- Enum Types
-- ============================================

CREATE TYPE severity_level AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE event_type AS ENUM ('Malware', 'Phishing', 'DDoS', 'Intrusion', 'Data Breach', 'Ransomware', 'Suspicious Activity');
CREATE TYPE event_status AS ENUM ('Active', 'Investigating', 'Resolved', 'False Positive');
CREATE TYPE asset_type AS ENUM ('Server', 'Workstation', 'Database', 'Network Device', 'Cloud Service');
CREATE TYPE asset_environment AS ENUM ('Production', 'Staging', 'Development');

-- ============================================
-- Shared updated_at trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Assets
-- ============================================
-- Systems that can be targeted by security events. Criticality lets the
-- dashboard weight risk: an attack on a Critical production database
-- matters more than one on a dev workstation.

CREATE TABLE assets (
    asset_id     SERIAL PRIMARY KEY,
    hostname     VARCHAR(255) NOT NULL UNIQUE,
    asset_type   asset_type NOT NULL,
    environment  asset_environment NOT NULL,
    criticality  severity_level NOT NULL,
    ip_address   INET,
    owner_team   VARCHAR(100),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Threat Intelligence
-- ============================================
-- Known threats/campaigns from intel feeds. first_seen/last_seen describe
-- the threat globally; how often it hit *our* assets is derived from
-- security_events rather than stored here.

CREATE TABLE threat_intelligence (
    threat_id                 SERIAL PRIMARY KEY,
    threat_name               VARCHAR(255) NOT NULL UNIQUE,
    threat_category           event_type NOT NULL,
    risk_level                severity_level NOT NULL,
    description               TEXT,
    indicators_of_compromise  JSONB NOT NULL DEFAULT '{}'::jsonb,
    first_seen                TIMESTAMPTZ NOT NULL,
    last_seen                 TIMESTAMPTZ NOT NULL,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT threat_seen_order CHECK (last_seen >= first_seen)
);

-- ============================================
-- Security Events
-- ============================================
-- Lifecycle timestamps drive the response metrics:
--   MTTD (mean time to detect)  = detected_at - occurred_at
--   MTTA (mean time to ack)     = acknowledged_at - detected_at
--   MTTR (mean time to resolve) = resolved_at - detected_at
--
-- Status and timestamps are kept consistent by constraints:
--   Active                    -> not yet acknowledged, not resolved
--   Investigating             -> acknowledged, not resolved
--   Resolved / False Positive -> acknowledged and resolved

CREATE TABLE security_events (
    event_id         SERIAL PRIMARY KEY,
    event_type       event_type NOT NULL,
    severity         severity_level NOT NULL,
    status           event_status NOT NULL DEFAULT 'Active',
    asset_id         INTEGER NOT NULL REFERENCES assets(asset_id) ON DELETE RESTRICT,
    threat_id        INTEGER REFERENCES threat_intelligence(threat_id) ON DELETE SET NULL,
    source_ip        INET,
    source_country   CHAR(2),  -- ISO 3166-1 alpha-2, for a future geographic view
    description      TEXT,
    threat_score     INTEGER NOT NULL CHECK (threat_score BETWEEN 0 AND 100),
    affected_users   INTEGER NOT NULL DEFAULT 0 CHECK (affected_users >= 0),
    occurred_at      TIMESTAMPTZ NOT NULL,
    detected_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at  TIMESTAMPTZ,
    resolved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT event_detected_after_occurred
        CHECK (detected_at >= occurred_at),
    CONSTRAINT event_acknowledged_after_detected
        CHECK (acknowledged_at IS NULL OR acknowledged_at >= detected_at),
    CONSTRAINT event_resolved_after_acknowledged
        CHECK (resolved_at IS NULL OR resolved_at >= acknowledged_at),
    CONSTRAINT event_acknowledged_matches_status
        CHECK ((status = 'Active') = (acknowledged_at IS NULL)),
    CONSTRAINT event_resolved_matches_status
        CHECK ((status IN ('Resolved', 'False Positive')) = (resolved_at IS NOT NULL)),
    CONSTRAINT event_source_country_format
        CHECK (source_country IS NULL OR source_country ~ '^[A-Z]{2}$')
);

-- ============================================
-- Indexes
-- ============================================
-- Postgres does not index foreign keys automatically.

CREATE INDEX idx_events_occurred_at ON security_events (occurred_at DESC);
CREATE INDEX idx_events_status_severity ON security_events (status, severity);
CREATE INDEX idx_events_event_type ON security_events (event_type);
CREATE INDEX idx_events_asset_id ON security_events (asset_id);
CREATE INDEX idx_events_threat_id ON security_events (threat_id) WHERE threat_id IS NOT NULL;

-- Open (unresolved) events are the hot path for KPI cards and the live feed
CREATE INDEX idx_events_open ON security_events (occurred_at DESC)
    WHERE status IN ('Active', 'Investigating');

CREATE INDEX idx_threats_category ON threat_intelligence (threat_category);
CREATE INDEX idx_assets_environment_criticality ON assets (environment, criticality);

-- ============================================
-- updated_at Triggers
-- ============================================

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_intelligence_updated_at BEFORE UPDATE ON threat_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_events_updated_at BEFORE UPDATE ON security_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
