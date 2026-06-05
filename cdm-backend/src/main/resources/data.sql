-- Seed two CDM machines for demo
INSERT INTO machine (machine_code, location, current_balance, total_capacity, low_threshold, status, created_at)
VALUES ('CDM-001', 'Anna Nagar Branch, Chennai', 100000.00, 500000.00, 100000.00, 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO machine (machine_code, location, current_balance, total_capacity, low_threshold, status, created_at)
VALUES ('CDM-002', 'T. Nagar Branch, Chennai', 250000.00, 500000.00, 100000.00, 'ACTIVE', CURRENT_TIMESTAMP);
