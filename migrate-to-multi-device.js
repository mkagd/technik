/**
 * Migration Script: Single Device → Multi-Device Orders
 * 
 * Converts orders.json from single device at order level
 * to devices[] array supporting multiple devices per order.
 * 
 * SAFE TO RUN MULTIPLE TIMES - Skips already migrated orders
 * 
 * Usage: node migrate-to-multi-device.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create timestamped backup
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `orders-backup-${timestamp}.json`);
  
  console.log(`\n📦 Creating backup...`);
  fs.copyFileSync(ORDERS_FILE, backupFile);
  console.log(`   ✅ Backup saved: ${backupFile}`);
  
  return backupFile;
}

/**
 * Check if order is already migrated
 */
function isAlreadyMigrated(order) {
  return order.devices && Array.isArray(order.devices) && order.devices.length > 0;
}

/**
 * Migrate single order from old format to new format
 */
function migrateOrder(order) {
  console.log(`\n🔄 Migrating order: ${order.id}`);
  
  // Create devices array from single device fields
  order.devices = [
    {
      deviceIndex: 0,
      deviceType: order.deviceType || '',
      brand: order.brand || '',
      model: order.model || '',
      serialNumber: order.serialNumber || '',
      issueDescription: order.issueDescription || '',
      status: 'active'
    }
  ];
  
  console.log(`   ✅ Created devices[0]: ${order.devices[0].deviceType || 'Empty'} ${order.devices[0].brand || ''}`);
  
  // Migrate visits if they exist
  if (order.visits && Array.isArray(order.visits)) {
    console.log(`   📋 Found ${order.visits.length} visit(s)`);
    
    order.visits.forEach((visit, vIndex) => {
      // Migrate models to deviceModels structure
      if (visit.models && Array.isArray(visit.models) && visit.models.length > 0) {
        console.log(`      🔧 Visit ${vIndex + 1}: Migrating ${visit.models.length} model(s)`);
        
        // Create deviceModels structure
        visit.deviceModels = [
          {
            deviceIndex: 0,
            models: visit.models.map(model => ({
              ...model,
              source: model.source || 'scanner'
            }))
          }
        ];
        
        console.log(`      ✅ Created deviceModels[0] with ${visit.models.length} models`);
        
        // Keep old models array for backward compatibility (don't delete yet)
        // We'll phase it out later
      } else {
        // No models yet, initialize empty deviceModels
        visit.deviceModels = [];
      }
    });
  }
  
  // Keep old single-device fields for backward compatibility during transition
  // We can remove these later after all code is updated:
  // - deviceType
  // - brand
  // - model
  // - serialNumber
  // - issueDescription (this one stays at order level as general description)
  
  return order;
}

/**
 * Main migration function
 */
function runMigration() {
  console.log(`\n🚀 Starting Multi-Device Migration`);
  console.log(`   📁 Orders file: ${ORDERS_FILE}`);
  
  // Check if orders.json exists
  if (!fs.existsSync(ORDERS_FILE)) {
    console.error(`\n❌ ERROR: orders.json not found at ${ORDERS_FILE}`);
    process.exit(1);
  }
  
  // Create backup
  const backupFile = createBackup();
  
  // Load orders
  console.log(`\n📖 Loading orders...`);
  let orders;
  try {
    const ordersData = fs.readFileSync(ORDERS_FILE, 'utf-8');
    orders = JSON.parse(ordersData);
  } catch (error) {
    console.error(`\n❌ ERROR: Failed to parse orders.json`);
    console.error(error);
    process.exit(1);
  }
  
  console.log(`   ✅ Loaded ${orders.length} orders`);
  
  // Migration counters
  let migratedCount = 0;
  let alreadyMigratedCount = 0;
  let errorCount = 0;
  
  // Process each order
  console.log(`\n🔄 Processing orders...`);
  orders.forEach((order, index) => {
    try {
      // Skip if already migrated
      if (isAlreadyMigrated(order)) {
        console.log(`\n⏭️  Order ${order.id}: Already migrated (has devices array)`);
        alreadyMigratedCount++;
        return;
      }
      
      // Migrate order
      migrateOrder(order);
      migratedCount++;
      
    } catch (error) {
      console.error(`\n❌ ERROR migrating order ${order.id}:`);
      console.error(error);
      errorCount++;
    }
  });
  
  // Save migrated data
  if (migratedCount > 0) {
    console.log(`\n💾 Saving migrated data...`);
    try {
      fs.writeFileSync(
        ORDERS_FILE,
        JSON.stringify(orders, null, 2),
        'utf-8'
      );
      console.log(`   ✅ Saved to ${ORDERS_FILE}`);
    } catch (error) {
      console.error(`\n❌ ERROR: Failed to save orders.json`);
      console.error(error);
      console.log(`\n🔄 To restore backup, run: node rollback-migration.js`);
      process.exit(1);
    }
  } else {
    console.log(`\n⏭️  No changes made (all orders already migrated)`);
  }
  
  // Print summary
  console.log(`\n\n📊 Migration Summary`);
  console.log(`   ═══════════════════════════════════════`);
  console.log(`   ✅ Successfully migrated:  ${migratedCount}`);
  console.log(`   ⏭️  Already migrated:      ${alreadyMigratedCount}`);
  console.log(`   ❌ Errors:                 ${errorCount}`);
  console.log(`   ───────────────────────────────────────`);
  console.log(`   📁 Total orders:           ${orders.length}`);
  console.log(`   ═══════════════════════════════════════`);
  
  if (errorCount > 0) {
    console.log(`\n⚠️  WARNING: ${errorCount} error(s) occurred during migration`);
    console.log(`   Review errors above and consider rollback if needed`);
  }
  
  console.log(`\n💾 Backup location: ${backupFile}`);
  console.log(`   To rollback: node rollback-migration.js\n`);
  
  if (migratedCount > 0) {
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Restart server: npm run dev`);
    console.log(`   2. Test API endpoints with migrated data`);
    console.log(`   3. Verify technician panel displays devices correctly`);
    console.log(`   4. Check admin panel order details\n`);
  }
}

// Run migration
try {
  runMigration();
} catch (error) {
  console.error(`\n❌ FATAL ERROR during migration:`);
  console.error(error);
  console.log(`\n🔄 To restore backup, run: node rollback-migration.js\n`);
  process.exit(1);
}
