/**
 * 🧪 COMPREHENSIVE AUTO-BACKUP SYSTEM TESTS
 * Tests backup creation, restoration, cleanup, and scheduling
 */

import { AutoBackupSystem } from './utils/autoBackup.js';
import fs from 'fs';
import path from 'path';

const TEST_CONFIG = {
  enabled: true,
  backupInterval: '*/5 * * * * *', // Every 5 seconds for testing
  backupDir: path.join(process.cwd(), 'test-backups'),
  dataDir: path.join(process.cwd(), 'data'),
  hourlyBackups: 3,
  dailyBackups: 2,
  weeklyBackups: 1,
  monthlyBackups: 1,
  compressBackups: false, // Disable for testing
  cloudSync: {
    enabled: false
  }
};

// Clean up test backups
function cleanupTestBackups() {
  if (fs.existsSync(TEST_CONFIG.backupDir)) {
    fs.rmSync(TEST_CONFIG.backupDir, { recursive: true, force: true });
  }
}

// Create test data
function createTestData() {
  const testDataDir = path.join(process.cwd(), 'test-data');
  
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  // Create test files
  const testFiles = {
    'clients.json': [
      { id: 1, name: 'Test Client 1', phone: '123456789' },
      { id: 2, name: 'Test Client 2', phone: '987654321' }
    ],
    'orders.json': [
      { id: 1, clientId: 1, description: 'Test Order 1' },
      { id: 2, clientId: 2, description: 'Test Order 2' }
    ],
    'settings.json': {
      theme: 'dark',
      language: 'pl',
      notifications: true
    }
  };
  
  for (const [filename, data] of Object.entries(testFiles)) {
    fs.writeFileSync(
      path.join(testDataDir, filename), 
      JSON.stringify(data, null, 2)
    );
  }
  
  return testDataDir;
}

async function testBackupSystemInitialization() {
  console.log('\n🧪 Testing Backup System Initialization...');
  
  try {
    cleanupTestBackups();
    
    const system = new AutoBackupSystem(TEST_CONFIG);
    const initialized = await system.initialize();
    
    if (!initialized) {
      console.error('❌ Backup system initialization failed');
      return false;
    }
    
    // Check if directories were created
    const requiredDirs = [
      TEST_CONFIG.backupDir,
      path.join(TEST_CONFIG.backupDir, 'hourly'),
      path.join(TEST_CONFIG.backupDir, 'daily'),
      path.join(TEST_CONFIG.backupDir, 'weekly'),
      path.join(TEST_CONFIG.backupDir, 'monthly'),
      path.join(TEST_CONFIG.backupDir, 'manual'),
      path.join(TEST_CONFIG.backupDir, 'metadata')
    ];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        console.error(`❌ Required directory not created: ${dir}`);
        return false;
      }
    }
    
    console.log('✅ Backup system initialization works');
    return true;
  } catch (error) {
    console.error('❌ Backup system initialization test failed:', error.message);
    return false;
  }
}

async function testBackupCreation() {
  console.log('\n🧪 Testing Backup Creation...');
  
  try {
    // Create test data
    const testDataDir = createTestData();
    const testConfig = { ...TEST_CONFIG, dataDir: testDataDir };
    
    const system = new AutoBackupSystem(testConfig);
    await system.initialize();
    
    // Create a manual backup
    const result = await system.createBackup('manual');
    
    if (!result.success) {
      console.error('❌ Backup creation failed:', result.error);
      return false;
    }
    
    // Verify backup was created
    if (!fs.existsSync(result.path)) {
      console.error('❌ Backup directory not created');
      return false;
    }
    
    // Check if metadata file exists
    const metadataPath = path.join(result.path, 'backup-metadata.json');
    if (!fs.existsSync(metadataPath)) {
      console.error('❌ Backup metadata not created');
      return false;
    }
    
    // Verify metadata content
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    if (!metadata.timestamp || !metadata.type || !metadata.files) {
      console.error('❌ Invalid backup metadata');
      return false;
    }
    
    // Check if actual files were backed up
    const expectedFiles = ['clients.json', 'orders.json', 'settings.json'];
    for (const file of expectedFiles) {
      const backupFilePath = path.join(result.path, file);
      if (!fs.existsSync(backupFilePath)) {
        console.error(`❌ File not backed up: ${file}`);
        return false;
      }
    }
    
    console.log('✅ Backup creation works');
    console.log(`   - Backup path: ${result.path}`);
    console.log(`   - Files backed up: ${metadata.files.length}`);
    console.log(`   - Total size: ${metadata.totalSize} bytes`);
    
    // Clean up test data
    fs.rmSync(testDataDir, { recursive: true, force: true });
    
    return true;
  } catch (error) {
    console.error('❌ Backup creation test failed:', error.message);
    return false;
  }
}

async function testBackupRestoration() {
  console.log('\n🧪 Testing Backup Restoration...');
  
  try {
    // Create test data
    const testDataDir = createTestData();
    const testConfig = { ...TEST_CONFIG, dataDir: testDataDir };
    
    const system = new AutoBackupSystem(testConfig);
    await system.initialize();
    
    // Create initial backup
    const backupResult = await system.createBackup('manual');
    if (!backupResult.success) {
      console.error('❌ Initial backup creation failed');
      return false;
    }
    
    // Modify test data
    const clientsFile = path.join(testDataDir, 'clients.json');
    const modifiedClients = [
      { id: 1, name: 'Modified Client 1', phone: '111111111' },
      { id: 3, name: 'New Client 3', phone: '333333333' }
    ];
    fs.writeFileSync(clientsFile, JSON.stringify(modifiedClients, null, 2));
    
    // Restore from backup
    const restoreResult = await system.restoreFromBackup(backupResult.path);
    if (!restoreResult.success) {
      console.error('❌ Backup restoration failed:', restoreResult.error);
      return false;
    }
    
    // Verify restoration
    const restoredClients = JSON.parse(fs.readFileSync(clientsFile, 'utf8'));
    if (restoredClients.length !== 2 || restoredClients[0].name !== 'Test Client 1') {
      console.error('❌ Data not properly restored');
      return false;
    }
    
    console.log('✅ Backup restoration works');
    console.log(`   - Restored from: ${backupResult.path}`);
    console.log(`   - Restore point: ${restoreResult.restorePoint}`);
    
    // Clean up test data
    fs.rmSync(testDataDir, { recursive: true, force: true });
    
    return true;
  } catch (error) {
    console.error('❌ Backup restoration test failed:', error.message);
    return false;
  }
}

async function testBackupCleanup() {
  console.log('\n🧪 Testing Backup Cleanup...');
  
  try {
    const testDataDir = createTestData();
    const testConfig = { ...TEST_CONFIG, dataDir: testDataDir, hourlyBackups: 2 };
    
    const system = new AutoBackupSystem(testConfig);
    await system.initialize();
    
    // Create multiple backups
    const backups = [];
    for (let i = 0; i < 4; i++) {
      const result = await system.createBackup('hourly');
      if (result.success) {
        backups.push(result.path);
      }
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (backups.length !== 4) {
      console.error('❌ Not all test backups created');
      return false;
    }
    
    // Run cleanup
    await system.cleanupOldBackups();
    
    // Verify cleanup - should keep only 2 most recent
    const hourlyDir = path.join(TEST_CONFIG.backupDir, 'hourly');
    const remainingBackups = fs.readdirSync(hourlyDir)
      .filter(name => name.startsWith('backup_'));
    
    if (remainingBackups.length !== 2) {
      console.error(`❌ Cleanup failed. Expected 2 backups, found ${remainingBackups.length}`);
      return false;
    }
    
    // Verify newest backups were kept
    const oldestBackup = backups[0];
    const newestBackups = backups.slice(-2);
    
    if (fs.existsSync(oldestBackup)) {
      console.error('❌ Oldest backup not cleaned up');
      return false;
    }
    
    for (const backup of newestBackups) {
      if (!fs.existsSync(backup)) {
        console.error('❌ Recent backup was incorrectly cleaned up');
        return false;
      }
    }
    
    console.log('✅ Backup cleanup works');
    console.log(`   - Created: 4 backups`);
    console.log(`   - Remaining: ${remainingBackups.length} backups`);
    
    // Clean up test data
    fs.rmSync(testDataDir, { recursive: true, force: true });
    
    return true;
  } catch (error) {
    console.error('❌ Backup cleanup test failed:', error.message);
    return false;
  }
}

async function testBackupListing() {
  console.log('\n🧪 Testing Backup Listing...');
  
  try {
    const testDataDir = createTestData();
    const testConfig = { ...TEST_CONFIG, dataDir: testDataDir };
    
    const system = new AutoBackupSystem(testConfig);
    await system.initialize();
    
    // Create backups of different types
    const types = ['manual', 'hourly', 'daily'];
    const createdBackups = [];
    
    for (const type of types) {
      const result = await system.createBackup(type);
      if (result.success) {
        createdBackups.push({ type, path: result.path });
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // List backups
    const backupList = await system.listBackups();
    
    if (backupList.length !== types.length) {
      console.error(`❌ Backup listing failed. Expected ${types.length}, got ${backupList.length}`);
      return false;
    }
    
    // Verify backup list contains expected types
    const listedTypes = backupList.map(b => b.type);
    for (const type of types) {
      if (!listedTypes.includes(type)) {
        console.error(`❌ Backup type ${type} not in list`);
        return false;
      }
    }
    
    // Verify metadata is included
    for (const backup of backupList) {
      if (!backup.metadata || !backup.metadata.timestamp) {
        console.error('❌ Backup metadata missing from list');
        return false;
      }
    }
    
    console.log('✅ Backup listing works');
    console.log(`   - Listed: ${backupList.length} backups`);
    console.log(`   - Types: ${listedTypes.join(', ')}`);
    
    // Clean up test data
    fs.rmSync(testDataDir, { recursive: true, force: true });
    
    return true;
  } catch (error) {
    console.error('❌ Backup listing test failed:', error.message);
    return false;
  }
}

async function testBackupSystemStatus() {
  console.log('\n🧪 Testing Backup System Status...');
  
  try {
    const system = new AutoBackupSystem(TEST_CONFIG);
    await system.initialize();
    
    const status = system.getStatus();
    
    // Check required status fields
    const requiredFields = ['enabled', 'isRunning', 'scheduledBackups', 'stats', 'config'];
    for (const field of requiredFields) {
      if (!(field in status)) {
        console.error(`❌ Status missing required field: ${field}`);
        return false;
      }
    }
    
    // Check stats structure
    const requiredStats = ['totalBackups', 'lastBackup', 'totalSize', 'errors'];
    for (const stat of requiredStats) {
      if (!(stat in status.stats)) {
        console.error(`❌ Stats missing required field: ${stat}`);
        return false;
      }
    }
    
    console.log('✅ Backup system status works');
    console.log(`   - Enabled: ${status.enabled}`);
    console.log(`   - Running: ${status.isRunning}`);
    console.log(`   - Scheduled: ${status.scheduledBackups}`);
    console.log(`   - Total backups: ${status.stats.totalBackups}`);
    
    return true;
  } catch (error) {
    console.error('❌ Backup system status test failed:', error.message);
    return false;
  }
}

// Main test runner
export default async function runBackupTests() {
  console.log('🚀 Starting Auto-Backup System Tests...');
  
  const tests = [
    { name: 'System Initialization', fn: testBackupSystemInitialization },
    { name: 'Backup Creation', fn: testBackupCreation },
    { name: 'Backup Restoration', fn: testBackupRestoration },
    { name: 'Backup Cleanup', fn: testBackupCleanup },
    { name: 'Backup Listing', fn: testBackupListing },
    { name: 'System Status', fn: testBackupSystemStatus }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push({ name: test.name, success });
    } catch (error) {
      console.error(`❌ Test ${test.name} crashed:`, error.message);
      results.push({ name: test.name, success: false });
    }
  }
  
  // Clean up all test files
  cleanupTestBackups();
  
  // Report results
  console.log('\n📊 Backup System Test Results Summary:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All backup system tests passed! System is production-ready.');
  } else {
    console.log('⚠️ Some backup tests failed. Review implementation.');
  }
  
  return { passed, total, success: passed === total };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBackupTests().catch(console.error);
}