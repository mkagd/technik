/**
 * 🧪 COMPREHENSIVE FILE LOCKING TESTS
 * Tests concurrent access protection and data integrity
 */

import { FileLock, LockedFileOperations, cleanupStaleLocks } from './utils/fileLocking.js';
import fs from 'fs';
import path from 'path';

const TEST_DATA_DIR = path.join(process.cwd(), 'data', 'test-locking');
const TEST_FILE = path.join(TEST_DATA_DIR, 'test-file.json');

// Ensure test directory exists
function ensureTestDir() {
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
}

// Clean up test files
function cleanupTestFiles() {
  if (fs.existsSync(TEST_DATA_DIR)) {
    const files = fs.readdirSync(TEST_DATA_DIR);
    files.forEach(file => {
      fs.unlinkSync(path.join(TEST_DATA_DIR, file));
    });
    fs.rmdirSync(TEST_DATA_DIR);
  }
}

async function testBasicLocking() {
  console.log('\n🧪 Testing Basic File Locking...');
  
  ensureTestDir();
  const testFile = path.join(TEST_DATA_DIR, 'basic-test.json');
  const lock = new FileLock(testFile);
  
  try {
    // Test lock acquisition
    await lock.lock();
    console.log('✅ Lock acquired successfully');
    
    // Test that file is locked
    const isLocked = await lock.isFileLocked();
    console.log(`✅ File lock status: ${isLocked}`);
    
    // Test unlock
    await lock.unlock();
    console.log('✅ Lock released successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Basic locking test failed:', error.message);
    return false;
  }
}

async function testConcurrentAccess() {
  console.log('\n🧪 Testing Concurrent Access Protection...');
  
  ensureTestDir();
  const testFile = path.join(TEST_DATA_DIR, 'concurrent-test.json');
  
  // Initialize test data
  await LockedFileOperations.writeJSON(testFile, { counter: 0 });
  
  // Create multiple concurrent operations
  const operations = [];
  const NUM_OPERATIONS = 10;
  
  for (let i = 0; i < NUM_OPERATIONS; i++) {
    operations.push(
      LockedFileOperations.updateJSON(testFile, async (data) => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        data.counter += 1;
        data[`operation_${i}`] = {
          timestamp: new Date().toISOString(),
          processId: i
        };
        
        return data;
      })
    );
  }
  
  try {
    // Execute all operations concurrently
    const startTime = Date.now();
    await Promise.all(operations);
    const endTime = Date.now();
    
    // Verify result
    const finalData = await LockedFileOperations.readJSON(testFile);
    
    if (finalData.counter === NUM_OPERATIONS) {
      console.log(`✅ Concurrent operations completed successfully in ${endTime - startTime}ms`);
      console.log(`✅ Final counter value: ${finalData.counter} (expected: ${NUM_OPERATIONS})`);
      return true;
    } else {
      console.error(`❌ Data corruption detected. Counter: ${finalData.counter}, Expected: ${NUM_OPERATIONS}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Concurrent access test failed:', error.message);
    return false;
  }
}

async function testBatchOperations() {
  console.log('\n🧪 Testing Batch Operations...');
  
  ensureTestDir();
  const file1 = path.join(TEST_DATA_DIR, 'batch1.json');
  const file2 = path.join(TEST_DATA_DIR, 'batch2.json');
  const file3 = path.join(TEST_DATA_DIR, 'batch3.json');
  
  try {
    // Initialize test files
    await LockedFileOperations.writeJSON(file1, { data: 'file1' });
    await LockedFileOperations.writeJSON(file2, { data: 'file2' });
    await LockedFileOperations.writeJSON(file3, { data: 'file3' });
    
    // Perform batch operation
    const result = await LockedFileOperations.batchOperation([file1, file2, file3], async () => {
      // Read all files
      const data1 = await fs.promises.readFile(file1, 'utf8');
      const data2 = await fs.promises.readFile(file2, 'utf8');
      const data3 = await fs.promises.readFile(file3, 'utf8');
      
      // Modify and write back
      const json1 = JSON.parse(data1);
      const json2 = JSON.parse(data2);
      const json3 = JSON.parse(data3);
      
      json1.batchModified = true;
      json2.batchModified = true;
      json3.batchModified = true;
      
      await fs.promises.writeFile(file1, JSON.stringify(json1, null, 2));
      await fs.promises.writeFile(file2, JSON.stringify(json2, null, 2));
      await fs.promises.writeFile(file3, JSON.stringify(json3, null, 2));
      
      return 'batch_complete';
    });
    
    // Verify results
    const final1 = await LockedFileOperations.readJSON(file1);
    const final2 = await LockedFileOperations.readJSON(file2);
    const final3 = await LockedFileOperations.readJSON(file3);
    
    if (final1.batchModified && final2.batchModified && final3.batchModified) {
      console.log('✅ Batch operations completed successfully');
      return true;
    } else {
      console.error('❌ Batch operations failed - not all files modified');
      return false;
    }
  } catch (error) {
    console.error('❌ Batch operations test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  try {
    // Test reading non-existent file with default
    const data = await LockedFileOperations.readJSON('/non/existent/file.json', { default: true });
    if (data.default === true) {
      console.log('✅ Default value handling works');
    } else {
      console.error('❌ Default value handling failed');
      return false;
    }
    
    // Test writing to invalid directory
    try {
      await LockedFileOperations.writeJSON('/invalid/path/file.json', { test: true });
      console.error('❌ Should have failed writing to invalid path');
      return false;
    } catch (error) {
      console.log('✅ Invalid path error handling works');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

async function testLockCleanup() {
  console.log('\n🧪 Testing Lock Cleanup...');
  
  ensureTestDir();
  
  try {
    // Create some lock files manually
    const lockFile1 = path.join(TEST_DATA_DIR, 'test1.json.lock');
    const lockFile2 = path.join(TEST_DATA_DIR, 'test2.json.lock');
    
    fs.writeFileSync(lockFile1, 'test lock 1');
    fs.writeFileSync(lockFile2, 'test lock 2');
    
    // Wait a bit and clean up
    await new Promise(resolve => setTimeout(resolve, 100));
    await cleanupStaleLocks(TEST_DATA_DIR);
    
    // Verify cleanup (locks should still exist since they're not old enough)
    const exists1 = fs.existsSync(lockFile1);
    const exists2 = fs.existsSync(lockFile2);
    
    if (exists1 && exists2) {
      console.log('✅ Recent locks preserved during cleanup');
      
      // Clean up manually for next test
      fs.unlinkSync(lockFile1);
      fs.unlinkSync(lockFile2);
      
      return true;
    } else {
      console.error('❌ Lock cleanup test failed - recent locks removed');
      return false;
    }
  } catch (error) {
    console.error('❌ Lock cleanup test failed:', error.message);
    return false;
  }
}

async function testPerformance() {
  console.log('\n🧪 Testing Performance...');
  
  ensureTestDir();
  const testFile = path.join(TEST_DATA_DIR, 'performance-test.json');
  
  try {
    // Initialize with large data
    const largeData = {
      timestamp: new Date().toISOString(),
      records: Array(1000).fill(0).map((_, i) => ({
        id: i,
        data: `Record ${i}`,
        metadata: {
          created: new Date().toISOString(),
          processed: false
        }
      }))
    };
    
    // Test write performance
    const writeStart = Date.now();
    await LockedFileOperations.writeJSON(testFile, largeData);
    const writeTime = Date.now() - writeStart;
    
    // Test read performance
    const readStart = Date.now();
    const readData = await LockedFileOperations.readJSON(testFile);
    const readTime = Date.now() - readStart;
    
    // Test update performance
    const updateStart = Date.now();
    await LockedFileOperations.updateJSON(testFile, async (data) => {
      data.records.forEach(record => {
        record.metadata.processed = true;
      });
      return data;
    });
    const updateTime = Date.now() - updateStart;
    
    console.log(`✅ Performance test completed:`);
    console.log(`   - Write: ${writeTime}ms`);
    console.log(`   - Read: ${readTime}ms`);
    console.log(`   - Update: ${updateTime}ms`);
    console.log(`   - Data size: ${JSON.stringify(largeData).length} bytes`);
    
    return writeTime < 1000 && readTime < 500 && updateTime < 1000;
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    return false;
  }
}

// Main test runner
export default async function runFileLockingTests() {
  console.log('🚀 Starting File Locking System Tests...');
  
  const tests = [
    { name: 'Basic Locking', fn: testBasicLocking },
    { name: 'Concurrent Access', fn: testConcurrentAccess },
    { name: 'Batch Operations', fn: testBatchOperations },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Lock Cleanup', fn: testLockCleanup },
    { name: 'Performance', fn: testPerformance }
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
  
  // Clean up
  cleanupTestFiles();
  
  // Report results
  console.log('\n📊 Test Results Summary:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All file locking tests passed! System is production-ready.');
  } else {
    console.log('⚠️ Some tests failed. Review implementation before production use.');
  }
  
  return { passed, total, success: passed === total };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFileLockingTests().catch(console.error);
}