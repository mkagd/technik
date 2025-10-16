-- 🗄️ Supabase Database Schema for Technik App
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. CLIENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  nip TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- Client portal fields
  password TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);

-- ===========================================
-- 2. EMPLOYEES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_active BOOLEAN DEFAULT true,
  hourly_rate NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- Authentication
  password TEXT,
  last_login TIMESTAMP
);

CREATE INDEX idx_employees_email ON employees(email);

-- ===========================================
-- 3. ORDERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE,
  client_id TEXT REFERENCES clients(id),
  employee_id TEXT REFERENCES employees(id),
  
  -- Device info
  device_type TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  
  -- Order details
  description TEXT,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  
  -- Dates
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  
  -- Location
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  
  -- Pricing
  estimated_cost NUMERIC(10,2),
  final_cost NUMERIC(10,2),
  parts_cost NUMERIC(10,2),
  labor_cost NUMERIC(10,2),
  
  -- Additional data
  photos JSONB DEFAULT '[]',
  notes TEXT,
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_employee ON orders(employee_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(scheduled_date);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ===========================================
-- 4. VISITS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id),
  
  scheduled_date TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  status TEXT DEFAULT 'scheduled',
  visit_type TEXT,
  
  -- Location
  address TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  
  -- Results
  work_description TEXT,
  parts_used JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  
  -- Time tracking
  duration_minutes INTEGER,
  travel_distance_km NUMERIC(10,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_visits_order ON visits(order_id);
CREATE INDEX idx_visits_employee ON visits(employee_id);
CREATE INDEX idx_visits_date ON visits(scheduled_date);

-- ===========================================
-- 5. PARTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT,
  
  -- Inventory
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'szt',
  
  -- Pricing
  purchase_price NUMERIC(10,2),
  selling_price NUMERIC(10,2),
  
  -- Supplier
  supplier TEXT,
  supplier_code TEXT,
  
  -- Additional info
  description TEXT,
  location TEXT,
  photos JSONB DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_parts_sku ON parts(sku);
CREATE INDEX idx_parts_category ON parts(category);

-- ===========================================
-- 6. PART_REQUESTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS part_requests (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  employee_id TEXT REFERENCES employees(id),
  
  part_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  urgency TEXT DEFAULT 'normal',
  
  status TEXT DEFAULT 'pending',
  notes TEXT,
  
  requested_at TIMESTAMP DEFAULT NOW(),
  fulfilled_at TIMESTAMP,
  
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_part_requests_order ON part_requests(order_id);
CREATE INDEX idx_part_requests_status ON part_requests(status);

-- ===========================================
-- 7. SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW(),
  
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_client ON sessions(client_id);

-- ===========================================
-- 8. ACCOUNTS TABLE (Admin users)
-- ===========================================
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  
  role TEXT DEFAULT 'employee',
  permissions JSONB DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP
);

CREATE INDEX idx_accounts_email ON accounts(email);

-- ===========================================
-- 9. SETTINGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  category TEXT,
  description TEXT,
  
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by TEXT
);

-- ===========================================
-- 10. AUDIT_LOGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public access policies (adjust based on your needs)
-- For now, allow service role full access

CREATE POLICY "Service role has full access" ON clients
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON employees
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON visits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON parts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON part_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON accounts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- INITIAL DATA
-- ===========================================

-- Insert default admin account (password: admin123)
-- Note: Hash this password properly in production!
INSERT INTO accounts (id, email, password, name, role, permissions, is_active)
VALUES (
  'admin-001',
  'admin@technik.pl',
  'admin123',
  'Administrator Systemu',
  'admin',
  '["*"]'::jsonb,
  true
) ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- VIEWS FOR REPORTING
-- ===========================================

CREATE OR REPLACE VIEW orders_with_client_info AS
SELECT 
  o.*,
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone,
  e.name as employee_name
FROM orders o
LEFT JOIN clients c ON o.client_id = c.id
LEFT JOIN employees e ON o.employee_id = e.id;

-- ===========================================
-- ✅ SCHEMA COMPLETE
-- ===========================================
-- Run this entire script in Supabase SQL Editor
-- Then proceed to data migration
