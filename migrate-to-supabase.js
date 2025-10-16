// 🔄 Data Migration Script: JSON Files → Supabase
// Run this once to migrate all existing data to Supabase

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.supabase' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure .env.supabase file exists with:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to read JSON files safely
function readJSON(filePath) {
  try {
    const fullPath = path.join(__dirname, 'data', filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}, skipping...`);
      return null;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Migration functions
async function migrateClients() {
  console.log('\n📋 Migrating clients...');
  const clients = readJSON('clients.json');
  if (!clients || clients.length === 0) {
    console.log('  No clients to migrate');
    return;
  }

  // Map JSON structure to Supabase schema
  const mappedClients = clients.map((client, index) => {
    const primaryAddress = client.addresses?.find(a => a.isPrimary) || client.addresses?.[0];
    const primaryPhone = client.phones?.find(p => p.isPrimary) || client.phones?.[0];
    
    return {
      id: client.id || `CLI-${Date.now()}-${index}`,
      name: client.name,
      email: client.email || null,
      phone: primaryPhone?.number || client.phone || null,
      address: primaryAddress?.street || client.street || client.address || null,
      city: primaryAddress?.city || client.city || null,
      postal_code: primaryAddress?.postalCode || client.postalCode || null,
      nip: client.nip || null,
      company: client.company || null,
      notes: client.notes || null,
      created_at: client.dateAdded || client.createdAt || new Date().toISOString(),
      updated_at: client.updatedAt || new Date().toISOString(),
      password: client.passwordHash || null,
      is_active: client.isActive !== false,
      last_login: client.lastLogin || null,
      failed_login_attempts: client.failedLoginAttempts || 0,
      locked_until: client.lockedUntil || null
    };
  });

  const { data, error } = await supabase
    .from('clients')
    .upsert(mappedClients, { onConflict: 'id' });

  if (error) {
    console.error('  ❌ Error:', error.message);
  } else {
    console.log(`  ✅ Migrated ${mappedClients.length} clients`);
  }
}

async function migrateEmployees() {
  console.log('\n👷 Migrating employees...');
  const employees = readJSON('employees.json');
  if (!employees || employees.length === 0) {
    console.log('  No employees to migrate');
    return;
  }

  // Map JSON structure to Supabase schema
  const mappedEmployees = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    email: emp.email || null,
    phone: emp.phone || null,
    role: emp.role || null,
    is_active: emp.isActive !== false,
    hourly_rate: emp.hourlyRate || null,
    created_at: emp.createdAt || new Date().toISOString(),
    updated_at: emp.updatedAt || new Date().toISOString(),
    password: emp.passwordHash || emp.loginToken || null,
    last_login: emp.lastLogin || null
  }));

  const { data, error } = await supabase
    .from('employees')
    .upsert(mappedEmployees, { onConflict: 'id' });

  if (error) {
    console.error('  ❌ Error:', error.message);
  } else {
    console.log(`  ✅ Migrated ${mappedEmployees.length} employees`);
  }
}

async function migrateOrders() {
  console.log('\n📦 Migrating orders...');
  const orders = readJSON('orders.json');
  if (!orders || orders.length === 0) {
    console.log('  No orders to migrate');
    return;
  }

  // Map JSON structure to Supabase schema
  const mappedOrders = orders.map(order => ({
    id: order.id,
    order_number: order.orderNumber || order.id,
    client_id: order.clientId || null,
    employee_id: order.assignedTo || null,
    
    // Device info
    device_type: order.deviceType || null,
    brand: order.brand || null,
    model: order.model || null,
    serial_number: order.serialNumber || null,
    
    // Order details
    description: order.issueDescription || order.description || null,
    status: order.status || 'new',
    priority: order.priority || 'normal',
    
    // Dates
    created_at: order.createdAt || new Date().toISOString(),
    updated_at: order.updatedAt || new Date().toISOString(),
    scheduled_date: order.scheduledDate || order.preferredDate || null,
    completed_date: order.completedAt || null,
    
    // Location
    address: order.serviceAddress || order.clientAddress || null,
    city: order.city || null,
    postal_code: order.postalCode || null,
    latitude: order.latitude || null,
    longitude: order.longitude || null,
    
    // Pricing
    estimated_cost: order.estimatedCost || null,
    final_cost: order.finalCost || null,
    parts_cost: order.partsCost || null,
    labor_cost: order.laborCost || null,
    
    // Additional data
    photos: order.photos || [],
    notes: order.notes || null,
    internal_notes: order.internalNotes || null,
    metadata: {
      statusHistory: order.statusHistory || [],
      devices: order.devices || [],
      preferredTime: order.preferredTime || null,
      ...order.metadata
    }
  }));

  const { data, error } = await supabase
    .from('orders')
    .upsert(mappedOrders, { onConflict: 'id' });

  if (error) {
    console.error('  ❌ Error:', error.message);
  } else {
    console.log(`  ✅ Migrated ${mappedOrders.length} orders`);
  }
}

async function migrateVisits() {
  console.log('\n🚗 Migrating visits...');
  const visits = readJSON('visits.json');
  if (!visits || visits.length === 0) {
    console.log('  No visits to migrate');
    return;
  }

  // Ensure JSONB fields are properly formatted
  const formattedVisits = visits.map(visit => ({
    ...visit,
    parts_used: visit.parts_used || [],
    photos: visit.photos || [],
    metadata: visit.metadata || {}
  }));

  const { data, error } = await supabase
    .from('visits')
    .upsert(formattedVisits, { onConflict: 'id' });

  if (error) {
    console.error('  ❌ Error:', error.message);
  } else {
    console.log(`  ✅ Migrated ${visits.length} visits`);
  }
}

async function migrateParts() {
  console.log('\n🔧 Migrating parts...');
  const parts = readJSON('parts.json');
  if (!parts || parts.length === 0) {
    console.log('  No parts to migrate');
    return;
  }

  // Ensure JSONB fields are properly formatted
  const formattedParts = parts.map(part => ({
    ...part,
    photos: part.photos || [],
    metadata: part.metadata || {}
  }));

  const { data, error } = await supabase
    .from('parts')
    .upsert(formattedParts, { onConflict: 'id' });

  if (error) {
    console.error('  ❌ Error:', error.message);
  } else {
    console.log(`  ✅ Migrated ${parts.length} parts`);
  }
}

async function migratePartRequests() {
  console.log('\n📝 Migrating part requests...');
  const partRequests = readJSON('part-requests.json');
  if (!partRequests || partRequests.length === 0) {
    console.log('  No part requests to migrate');
    return;
  }

  // Handle both array and object formats
  const requestsArray = Array.isArray(partRequests) ? partRequests : Object.values(partRequests);
  
  // Ensure JSONB fields are properly formatted
  const formattedRequests = requestsArray.map(req => ({
    id: req.id || `PR-${Date.now()}-${Math.random()}`,
    order_id: req.orderId || req.order_id || null,
    employee_id: req.employeeId || req.employee_id || null,
    part_name: req.partName || req.part_name || 'Unknown',
    quantity: req.quantity || 1,
    urgency: req.urgency || req.priority || 'normal',
    status: req.status || 'pending',
    notes: req.notes || null,
    requested_at: req.requestedAt || req.requested_at || new Date().toISOString(),
    fulfilled_at: req.fulfilledAt || req.fulfilled_at || null,
    metadata: req.metadata || {}
  }));

  const { data, error } = await supabase
    .from('part_requests')
    .upsert(formattedRequests, { onConflict: 'id' });

  if (error) {
    console.error('  ❌ Error:', error.message);
  } else {
    console.log(`  ✅ Migrated ${formattedRequests.length} part requests`);
  }
}

async function migrateSessions() {
  console.log('\n🔐 Migrating sessions...');
  const sessions = readJSON('sessions.json');
  if (!sessions || sessions.length === 0) {
    console.log('  No sessions to migrate');
    return;
  }

  const { data, error } = await supabase
    .from('sessions')
    .upsert(sessions, { onConflict: 'id' });

  if (error) {
    console.error('  ❌ Error:', error.message);
  } else {
    console.log(`  ✅ Migrated ${sessions.length} sessions`);
  }
}

async function migrateAccounts() {
  console.log('\n👤 Migrating accounts...');
  const accounts = readJSON('accounts.json');
  if (!accounts || accounts.length === 0) {
    console.log('  No accounts to migrate');
    return;
  }

  // Map JSON structure to Supabase schema
  const mappedAccounts = accounts.map(account => ({
    id: account.id,
    email: account.email,
    password: account.password,
    name: account.name || null,
    role: account.role || 'employee',
    permissions: account.permissions || [],
    is_active: account.isActive !== false,
    created_at: account.createdAt || new Date().toISOString(),
    updated_at: account.updatedAt || new Date().toISOString(),
    last_login: account.lastLogin || null,
    login_attempts: account.loginAttempts || 0,
    locked_until: account.lockedUntil || null
  }));

  const { data, error } = await supabase
    .from('accounts')
    .upsert(mappedAccounts, { onConflict: 'id' });

  if (error) {
    console.error('  ❌ Error:', error.message);
  } else {
    console.log(`  ✅ Migrated ${mappedAccounts.length} accounts`);
  }
}

async function migrateSettings() {
  console.log('\n⚙️  Migrating settings...');
  const settings = readJSON('settings.json');
  if (!settings) {
    console.log('  No settings to migrate');
    return;
  }

  // Convert settings object to array of key-value pairs
  const settingsArray = Object.entries(settings).map(([key, value]) => ({
    key,
    value: typeof value === 'object' ? value : { data: value },
    category: 'general',
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('settings')
    .upsert(settingsArray, { onConflict: 'key' });

  if (error) {
    console.error('  ❌ Error:', error.message);
  } else {
    console.log(`  ✅ Migrated ${settingsArray.length} settings`);
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const tables = [
    'clients',
    'employees',
    'orders',
    'visits',
    'parts',
    'part_requests',
    'sessions',
    'accounts',
    'settings'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ❌ ${table}: Error - ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: ${count} records`);
    }
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Supabase Migration...');
  console.log('================================\n');

  try {
    // Migrate in order (to maintain referential integrity)
    await migrateClients();
    await migrateEmployees();
    await migrateOrders();
    await migrateVisits();
    await migrateParts();
    await migratePartRequests();
    await migrateSessions();
    await migrateAccounts();
    await migrateSettings();

    // Verify
    await verifyMigration();

    console.log('\n================================');
    console.log('✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Check Supabase Dashboard to verify data');
    console.log('2. Start migrating API endpoints to use Supabase');
    console.log('3. Test the application thoroughly');
    console.log('4. Deploy to Vercel when ready\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
