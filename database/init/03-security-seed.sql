-- ============================================
-- Security Dashboard Seed Data
-- ============================================
-- Populates assets, threat intelligence and ~500 security events spread
-- over the last 30 days. All times are relative to NOW() at init, so the
-- dashboard looks "live" right after a fresh `docker compose up`.
--
-- The generated events model:
--   - Weighted event type / severity mix (mostly Low/Medium, few Critical)
--   - Two attack campaigns that show up as spikes on the timeline, plus a
--     burst of activity in the last 24h so there are open events to triage
--   - A skewed pool of repeat attacker IPs (each with a fixed country) so
--     "top sources" and geographic views have something to show
--   - Event types landing on plausible assets (phishing -> workstations, ...)
--   - Response times that scale with severity and improve over the month,
--     so MTTD/MTTR trend charts tell a story
--   - Status derived from lifecycle timestamps: recent events are still
--     Active/Investigating, older ones are mostly Resolved
-- ============================================

-- Make the "random" data reproducible across fresh inits
SELECT setseed(0.2026);

-- ============================================
-- Assets
-- ============================================

INSERT INTO assets (hostname, asset_type, environment, criticality, ip_address, owner_team) VALUES
('firewall-edge-01',    'Network Device', 'Production',  'Critical', '10.0.0.1',   'Network Security'),
('vpn-gateway-01',      'Network Device', 'Production',  'Critical', '10.0.0.2',   'Network Security'),
('vpn-gateway-02',      'Network Device', 'Production',  'Critical', '10.0.0.3',   'Network Security'),
('api-gateway-prod',    'Network Device', 'Production',  'Critical', '10.0.1.5',   'Platform'),
('web-server-prod-01',  'Server',         'Production',  'High',     '10.0.1.11',  'Web Platform'),
('web-server-prod-02',  'Server',         'Production',  'High',     '10.0.1.12',  'Web Platform'),
('api-prod-03',         'Server',         'Production',  'High',     '10.0.1.23',  'Platform'),
('database-prod-01',    'Database',       'Production',  'Critical', '10.0.2.10',  'Data Engineering'),
('database-server-03',  'Database',       'Production',  'Critical', '10.0.2.13',  'Data Engineering'),
('database-staging-01', 'Database',       'Staging',     'Medium',   '10.1.2.10',  'Data Engineering'),
('file-server-prod-05', 'Server',         'Production',  'High',     '10.0.3.15',  'IT Operations'),
('file-server-backup',  'Server',         'Production',  'Medium',   '10.0.3.50',  'IT Operations'),
('email-gateway-01',    'Network Device', 'Production',  'High',     '10.0.4.5',   'IT Operations'),
('email-gateway-02',    'Network Device', 'Production',  'High',     '10.0.4.6',   'IT Operations'),
('k8s-cluster-prod',    'Cloud Service',  'Production',  'Critical', NULL,         'Platform'),
('s3-customer-exports', 'Cloud Service',  'Production',  'High',     NULL,         'Data Engineering'),
('ci-runner-01',        'Server',         'Development', 'Medium',   '10.2.0.21',  'DevOps'),
('app-staging-01',      'Server',         'Staging',     'Low',      '10.1.1.11',  'Web Platform'),
('workstation-dev-23',  'Workstation',    'Development', 'Low',      '10.3.0.123', 'Engineering'),
('workstation-dev-31',  'Workstation',    'Development', 'Low',      '10.3.0.131', 'Engineering'),
('workstation-fin-07',  'Workstation',    'Production',  'Medium',   '10.3.1.107', 'Finance'),
('workstation-fin-12',  'Workstation',    'Production',  'Medium',   '10.3.1.112', 'Finance'),
('workstation-exec-02', 'Workstation',    'Production',  'High',     '10.3.2.102', 'Executive Office'),
('workstation-hr-04',   'Workstation',    'Production',  'Medium',   '10.3.3.104', 'People Ops'),
('laptop-sales-15',     'Workstation',    'Production',  'Low',      '10.3.4.115', 'Sales');

-- ============================================
-- Threat Intelligence
-- ============================================
-- first_seen/last_seen are widened at the end of this file to cover every
-- event linked to the threat.

INSERT INTO threat_intelligence (threat_name, threat_category, risk_level, description, indicators_of_compromise, first_seen, last_seen) VALUES
('Emotet Banking Trojan', 'Malware', 'Critical',
 'Banking trojan that steals credentials and delivers additional malware payloads. Known for spreading via malicious email attachments.',
 '{"md5": ["4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"], "domains": ["malicious-domain[.]ru"]}',
 NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 minutes'),

('Office365 Credential Harvesting', 'Phishing', 'High',
 'Phishing campaign impersonating Microsoft Office365 login pages to steal corporate credentials.',
 '{"urls": ["fake-office-login[.]com"], "ip_ranges": ["185.220.101.0/24"]}',
 NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 hours'),

('Mirai Botnet DDoS', 'DDoS', 'Medium',
 'IoT botnet conducting volumetric DDoS attacks against web infrastructure.',
 '{"ip_ranges": ["203.0.113.0/24"], "user_agents": ["Mozilla/5.0 (X11; Linux)"]}',
 NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 hours'),

('APT41 Reconnaissance', 'Intrusion', 'Critical',
 'Advanced persistent threat group conducting network reconnaissance and data exfiltration attempts.',
 '{"techniques": ["T1046 Network Service Discovery", "T1190 Exploit Public-Facing Application", "T1021 Remote Services"]}',
 NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 hour'),

('Cryptomining Software', 'Suspicious Activity', 'Medium',
 'Unauthorized cryptocurrency mining software detected on workstations, consuming CPU resources.',
 '{"processes": ["xmrig.exe"], "domains": ["pool.minexmr[.]com:4444"]}',
 NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 hours'),

('LockBit 3.0 Ransomware', 'Ransomware', 'Critical',
 'Ransomware-as-a-service operation that encrypts file shares and exfiltrates data for double extortion.',
 '{"file_extensions": [".locked"], "sha256": ["a3f1c9e0b7d24e6f8a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6071"]}',
 NOW() - INTERVAL '40 days', NOW() - INTERVAL '2 minutes'),

('Cobalt Strike Beacon', 'Intrusion', 'High',
 'Post-exploitation framework beacons used for command and control and lateral movement.',
 '{"domains": ["cdn-update-check[.]net"], "ja3": ["72a589da586844d7f0818ce684948eea"]}',
 NOW() - INTERVAL '25 days', NOW() - INTERVAL '6 hours'),

('Cloud Storage Exfiltration', 'Data Breach', 'High',
 'Bulk downloads from misconfigured or over-permissioned cloud storage by compromised credentials.',
 '{"behaviors": ["ListObjects burst", "GetObject from new ASN"]}',
 NOW() - INTERVAL '20 days', NOW() - INTERVAL '8 minutes');

-- ============================================
-- Generated Security Events
-- ============================================

-- Log-uniform random duration: most values near `lo`, a long tail toward `hi`.
CREATE FUNCTION pg_temp.random_minutes(lo DOUBLE PRECISION, hi DOUBLE PRECISION)
RETURNS INTERVAL AS $$
    SELECT make_interval(secs => 60 * lo * power(hi / lo, random()))
$$ LANGUAGE sql VOLATILE;

INSERT INTO security_events (
    event_type, severity, status, asset_id, threat_id, source_ip, source_country,
    description, threat_score, affected_users,
    occurred_at, detected_at, acknowledged_at, resolved_at, created_at, updated_at
)
WITH
-- When each event happened: background noise, two campaigns, and recent
-- activity. Campaign events come from the IP ranges in their threat's IOCs.
schedule AS MATERIALIZED (
    SELECT NOW() - random() * INTERVAL '30 days' AS occurred_at,
           NULL::event_type AS forced_type,
           NULL::text AS forced_threat,
           NULL::inet AS forced_ip,
           NULL::text AS forced_country
    FROM generate_series(1, 440)
    UNION ALL
    -- Last 24 hours: enough fresh events that many are still open
    SELECT NOW() - random() * INTERVAL '24 hours', NULL, NULL, NULL, NULL
    FROM generate_series(1, 40)
    UNION ALL
    -- Office365 phishing wave ~9 days ago, over 36 hours
    SELECT NOW() - INTERVAL '9 days' + random() * INTERVAL '36 hours',
           'Phishing', 'Office365 Credential Harvesting',
           ('185.220.101.' || (1 + floor(random() * 254)::int))::inet, 'NL'
    FROM generate_series(1, 45)
    UNION ALL
    -- Mirai DDoS burst ~3 days ago, over 6 hours
    -- (botnet node country is derived from the address so it stays consistent)
    SELECT NOW() - INTERVAL '3 days' + random() * INTERVAL '6 hours',
           'DDoS', 'Mirai Botnet DDoS',
           ('203.0.113.' || host)::inet,
           (ARRAY['BR', 'VN', 'IN', 'CN'])[1 + host % 4]
    FROM (SELECT 1 + floor(random() * 254)::int AS host FROM generate_series(1, 25)) bots
),
-- Pick event type (weighted) for non-campaign events
typed AS MATERIALIZED (
    SELECT row_number() OVER () AS n,
           occurred_at,
           forced_threat,
           forced_ip,
           forced_country,
           -- Repeat attacker 1..80, skewed so low numbers recur most often
           1 + floor(power(random(), 1.5) * 80)::int AS attacker,
           COALESCE(forced_type, CASE
               WHEN type_r < 0.24 THEN 'Suspicious Activity'
               WHEN type_r < 0.46 THEN 'Phishing'
               WHEN type_r < 0.64 THEN 'Malware'
               WHEN type_r < 0.80 THEN 'Intrusion'
               WHEN type_r < 0.89 THEN 'DDoS'
               WHEN type_r < 0.95 THEN 'Ransomware'
               ELSE 'Data Breach'
           END::event_type) AS event_type,
           random() AS severity_r,
           random() AS threat_link_r
    FROM (SELECT *, random() AS type_r FROM schedule) s
),
-- Severity skews higher for ransomware/breaches, lower for suspicious activity
rated AS MATERIALIZED (
    SELECT t.*,
           CASE
               WHEN t.severity_r + b.bias > 0.92 THEN 'Critical'
               WHEN t.severity_r + b.bias > 0.72 THEN 'High'
               WHEN t.severity_r + b.bias > 0.38 THEN 'Medium'
               ELSE 'Low'
           END::severity_level AS severity
    FROM typed t
    JOIN (VALUES
        ('Ransomware'::event_type,  0.35),
        ('Data Breach',             0.30),
        ('Intrusion',               0.05),
        ('Malware',                 0.05),
        ('Phishing',                0.00),
        ('DDoS',                    0.00),
        ('Suspicious Activity',    -0.15)
    ) AS b(event_type, bias) USING (event_type)
),
-- Response time ranges in minutes, by severity. `trend` makes older events
-- up to 1.4x slower and recent ones 0.6x, so response times improve over time.
timed AS MATERIALIZED (
    SELECT r.*,
           (0.6 + 0.8 * EXTRACT(EPOCH FROM NOW() - r.occurred_at) / EXTRACT(EPOCH FROM INTERVAL '30 days')) AS trend,
           pg_temp.random_minutes(tm.detect_lo, tm.detect_hi) AS detect_delay,
           pg_temp.random_minutes(tm.ack_lo, tm.ack_hi) AS ack_delay,
           CASE WHEN random() < 0.04
                THEN NULL  -- a few long-running investigations never close
                ELSE pg_temp.random_minutes(tm.resolve_lo, tm.resolve_hi)
           END AS resolve_delay
    FROM rated r
    JOIN (VALUES
        --                  detect     ack         resolve
        ('Critical'::severity_level, 1, 20,   2,   30,   60,  720),
        ('High',                     3, 60,   5,   90,  120, 1440),
        ('Medium',                  10, 240, 15,  360,  240, 2880),
        ('Low',                     30, 720, 60, 1440,  120, 4320)
    ) AS tm(severity, detect_lo, detect_hi, ack_lo, ack_hi, resolve_lo, resolve_hi) USING (severity)
),
-- Candidate lifecycle timestamps; anything in the future hasn't happened yet
lifecycle AS MATERIALIZED (
    SELECT t.*,
           t.occurred_at + t.detect_delay * t.trend AS detected_at,
           t.occurred_at + (t.detect_delay + t.ack_delay) * t.trend AS ack_candidate,
           t.occurred_at + (t.detect_delay + t.ack_delay + t.resolve_delay) * t.trend AS resolve_candidate
    FROM timed t
)
SELECT
    l.event_type,
    l.severity,
    CASE
        WHEN l.resolve_candidate <= NOW() THEN
            CASE WHEN random() < (CASE WHEN l.event_type = 'Suspicious Activity' THEN 0.35 ELSE 0.08 END)
                 THEN 'False Positive' ELSE 'Resolved' END
        WHEN l.ack_candidate <= NOW() THEN 'Investigating'
        ELSE 'Active'
    END::event_status AS status,
    a.asset_id,
    th.threat_id,
    -- Attacker IP and country are derived from the attacker number, so the
    -- same attacker always has the same address and location
    COALESCE(
        l.forced_ip,
        format('%s.%s.%s.%s',
            (ARRAY[23, 31, 45, 46, 58, 61, 77, 79, 85, 91, 94, 103, 104, 109, 113, 121, 141, 176, 185, 188, 193, 195, 212, 217, 222])[1 + l.attacker % 25],
            (l.attacker * 53) % 256, (l.attacker * 97) % 256, 1 + (l.attacker * 29) % 254)::inet
    ) AS source_ip,
    COALESCE(
        l.forced_country,
        (ARRAY['CN', 'CN', 'CN', 'RU', 'RU', 'RU', 'US', 'US', 'KP', 'IR', 'IR', 'BR', 'IN', 'DE', 'NL', 'NL', 'RO', 'UA', 'VN', 'NG'])[1 + (l.attacker * 7) % 20]
    ) AS source_country,
    format((CASE l.event_type
        WHEN 'Malware' THEN ARRAY[
            'Trojan dropper quarantined on %s; parent process executed before containment.',
            'Keylogger signature matched in memory on %s. Credential theft suspected.',
            'Malicious PowerShell loader blocked by EDR on %s.']
        WHEN 'Phishing' THEN ARRAY[
            'Credential harvesting email reported by a user of %s and blocked.',
            'Macro-enabled attachment detonated in sandbox after delivery to %s.',
            'Spoofed executive email requesting a wire transfer detected at %s.']
        WHEN 'DDoS' THEN ARRAY[
            'Volumetric UDP flood against %s mitigated by upstream scrubbing.',
            'HTTP request flood against %s; rate limiting engaged.',
            'SYN flood saturating the connection table on %s.']
        WHEN 'Intrusion' THEN ARRAY[
            'Repeated SSH brute-force attempts against %s from a single source.',
            'SQL injection patterns detected in requests to %s.',
            'Lateral movement over SMB observed originating from %s.']
        WHEN 'Data Breach' THEN ARRAY[
            'Unusually large outbound transfer from %s to an unknown external host.',
            'Bulk export of customer records from %s outside business hours.',
            'Sensitive files on %s accessed with a compromised service account.']
        WHEN 'Ransomware' THEN ARRAY[
            'Mass file renames to the .locked extension detected on %s.',
            'Shadow copy deletion attempted on %s, a common ransomware precursor.',
            'Ransom note dropped in shared directories on %s.']
        ELSE ARRAY[
            'Login to %s from a new geographic location.',
            'Unusual process tree spawned by an office application on %s.',
            'Off-hours administrative access to %s.']
    END)[1 + floor(random() * 3)::int], a.hostname) AS description,
    CASE l.severity
        WHEN 'Critical' THEN 90 + floor(random() * 11)
        WHEN 'High'     THEN 70 + floor(random() * 20)
        WHEN 'Medium'   THEN 40 + floor(random() * 30)
        ELSE                  5 + floor(random() * 35)
    END::int AS threat_score,
    CASE l.event_type
        WHEN 'Data Breach' THEN floor(50 * power(1000, random()))  -- 50 .. 50,000
        WHEN 'Ransomware'  THEN 5 + floor(random() * 400)
        WHEN 'Phishing'    THEN 1 + floor(random() * 40)
        WHEN 'Malware'     THEN floor(random() * 3)
        ELSE 0
    END::int AS affected_users,
    l.occurred_at,
    l.detected_at,
    CASE WHEN l.ack_candidate <= NOW() THEN l.ack_candidate END AS acknowledged_at,
    CASE WHEN l.resolve_candidate <= NOW() THEN l.resolve_candidate END AS resolved_at,
    l.detected_at AS created_at,
    LEAST(NOW(), COALESCE(l.resolve_candidate, l.ack_candidate, l.detected_at)) AS updated_at
FROM lifecycle l
-- Land each event type on a plausible asset
CROSS JOIN LATERAL (
    SELECT asset_id, hostname
    FROM assets
    WHERE CASE l.event_type
        WHEN 'Phishing'    THEN asset_type = 'Workstation' OR hostname LIKE 'email-gateway-%'
        WHEN 'DDoS'        THEN hostname LIKE ANY (ARRAY['firewall-%', 'vpn-gateway-%', 'api-gateway-%', 'web-server-%', 'k8s-%'])
        WHEN 'Data Breach' THEN asset_type IN ('Database', 'Cloud Service') OR hostname LIKE 'file-server-%'
        WHEN 'Ransomware'  THEN asset_type IN ('Server', 'Workstation')
        WHEN 'Malware'     THEN asset_type IN ('Server', 'Workstation')
        WHEN 'Intrusion'   THEN asset_type <> 'Workstation'
        ELSE TRUE
    END
    ORDER BY random(), l.n  -- l.n forces per-row evaluation
    LIMIT 1
) a
-- Campaign events link to their campaign; ~40% of others to a matching threat
LEFT JOIN LATERAL (
    SELECT threat_id
    FROM threat_intelligence
    WHERE CASE
        WHEN l.forced_threat IS NOT NULL THEN threat_name = l.forced_threat
        ELSE threat_category = l.event_type AND l.threat_link_r < 0.4
    END
    ORDER BY random(), l.n
    LIMIT 1
) th ON TRUE
WHERE l.detected_at <= NOW()
ORDER BY l.occurred_at;

-- ============================================
-- Hand-written recent events
-- ============================================
-- The starter records, kept as the newest events so the live feed opens
-- with recognizable, detailed incidents. Offsets are minutes before NOW().

INSERT INTO security_events (
    event_type, severity, status, asset_id, threat_id, source_ip, source_country,
    description, threat_score, affected_users,
    occurred_at, detected_at, acknowledged_at, resolved_at, created_at, updated_at
)
SELECT v.event_type::event_type, v.severity::severity_level, v.status::event_status,
       a.asset_id, t.threat_id, v.source_ip::inet, v.source_country,
       v.description, v.threat_score, v.affected_users,
       NOW() - make_interval(mins => v.occurred_min),
       NOW() - make_interval(mins => v.detected_min),
       NOW() - make_interval(mins => v.ack_min),
       NOW() - make_interval(mins => v.resolved_min),
       NOW() - make_interval(mins => v.detected_min),
       NOW() - make_interval(mins => LEAST(v.detected_min, v.ack_min, v.resolved_min))
FROM (VALUES
    ('Ransomware', 'Critical', 'Active', 'file-server-prod-05', 'LockBit 3.0 Ransomware', '45.33.21.156', 'RU',
     'Ransomware encryption activity detected. Multiple file extensions being changed to .locked', 98, 250,
     3, 2, NULL, NULL),
    ('Malware', 'Critical', 'Active', 'web-server-prod-01', 'Emotet Banking Trojan', '185.220.101.45', 'DE',
     'Trojan.Generic.KD detected in system32 directory. File quarantined but process may have executed.', 95, 0,
     6, 5, NULL, NULL),
    ('Data Breach', 'Critical', 'Investigating', 'database-prod-01', 'Cloud Storage Exfiltration', '198.51.100.88', 'CN',
     'Unauthorized data export detected. 50,000+ customer records accessed and downloaded.', 92, 50000,
     10, 8, 4, NULL),
    ('Malware', 'High', 'Active', 'workstation-dev-23', NULL, '203.0.113.67', 'CN',
     'Keylogger detected on developer workstation. Credential theft suspected.', 85, 1,
     14, 12, NULL, NULL),
    ('Phishing', 'High', 'Investigating', 'email-gateway-02', 'Office365 Credential Harvesting', '104.28.192.78', 'NG',
     'Spear phishing campaign targeting executive team. 15 malicious emails detected and blocked.', 78, 15,
     17, 15, 10, NULL),
    ('Intrusion', 'High', 'Investigating', 'database-server-03', 'APT41 Reconnaissance', '192.0.2.156', 'CN',
     'Unauthorized database access attempt. Multiple failed login attempts followed by SQL injection patterns.', 82, 0,
     24, 22, 15, NULL),
    ('Intrusion', 'Medium', 'Investigating', 'vpn-gateway-02', NULL, '192.0.2.201', 'RO',
     'Brute force attack on VPN credentials. 1000+ failed login attempts in 5 minutes.', 70, 0,
     33, 28, 18, NULL),
    ('Suspicious Activity', 'Low', 'Resolved', 'api-prod-03', NULL, '104.28.192.99', 'US',
     'Unusual API access pattern from new geographic location. Verified as legitimate user.', 30, 0,
     38, 35, 30, 20),
    ('DDoS', 'Medium', 'Resolved', 'api-gateway-prod', 'Mirai Botnet DDoS', '203.0.113.42', 'BR',
     'Distributed denial of service attack detected. Traffic spike of 50k req/sec mitigated by rate limiting.', 65, 0,
     47, 45, 42, 30),
    ('Suspicious Activity', 'Low', 'False Positive', 'file-server-backup', NULL, '198.51.100.23', 'US',
     'Unusual file access pattern detected. Investigation revealed automated backup process.', 25, 0,
     62, 60, 50, 40)
) AS v(event_type, severity, status, hostname, threat_name, source_ip, source_country,
       description, threat_score, affected_users,
       occurred_min, detected_min, ack_min, resolved_min)
JOIN assets a ON a.hostname = v.hostname
LEFT JOIN threat_intelligence t ON t.threat_name = v.threat_name
ORDER BY v.occurred_min DESC;

-- ============================================
-- Keep threat sightings consistent with linked events
-- ============================================

UPDATE threat_intelligence t
SET first_seen = LEAST(t.first_seen, e.first_event),
    last_seen  = GREATEST(t.last_seen, e.last_event)
FROM (
    SELECT threat_id, MIN(occurred_at) AS first_event, MAX(occurred_at) AS last_event
    FROM security_events
    WHERE threat_id IS NOT NULL
    GROUP BY threat_id
) e
WHERE e.threat_id = t.threat_id;
