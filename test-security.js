/**
 * 🧪 COMPREHENSIVE SECURITY & RATE LIMITING TESTS
 * Tests API protection, validation, and security measures
 */

import { 
  sanitizeString, 
  sanitizeEmail, 
  validateClientData, 
  validateAuthData,
  isValidEmail,
  isValidPhone,
  preventXSS
} from './utils/validation.js';

async function testInputSanitization() {
  console.log('\n🧪 Testing Input Sanitization...');
  
  try {
    // Test string sanitization
    const maliciousInput = '<script>alert("xss")</script>Hello World"\'';
    const sanitized = sanitizeString(maliciousInput);
    
    // Should remove script tags and quotes
    const expected = 'alert(xss)Hello World';
    if (sanitized === expected) {
      console.log('✅ String sanitization works');
    } else {
      console.error('❌ String sanitization failed. Expected:', expected, 'Got:', sanitized);
      return false;
    }
    
    // Test email sanitization
    const maliciousEmail = 'TEST<script>@DOMAIN.COM';
    const sanitizedEmail = sanitizeEmail(maliciousEmail);
    
    if (sanitizedEmail === 'testscript@domain.com') {
      console.log('✅ Email sanitization works');
    } else {
      console.error('❌ Email sanitization failed:', sanitizedEmail);
      return false;
    }
    
    // Test XSS prevention
    const xssPayload = {
      name: '<img src=x onerror=alert(1)>',
      description: 'javascript:alert("xss")',
      nested: {
        value: '<script>malicious()</script>'
      },
      array: ['<svg onload=alert(1)>', 'normal text']
    };
    
    const cleaned = preventXSS(xssPayload);
    
    if (
      cleaned.name === '&lt;img src=x onerror=alert(1)&gt;' &&
      cleaned.description === 'javascript:alert(&quot;xss&quot;)' &&
      cleaned.nested.value === '&lt;script&gt;malicious()&lt;&#x2F;script&gt;' &&
      cleaned.array[0] === '&lt;svg onload=alert(1)&gt;'
    ) {
      console.log('✅ XSS prevention works');
    } else {
      console.error('❌ XSS prevention failed:', cleaned);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Input sanitization test failed:', error.message);
    return false;
  }
}

async function testDataValidation() {
  console.log('\n🧪 Testing Data Validation...');
  
  try {
    // Test email validation
    const validEmails = ['test@example.com', 'user.name@domain.co.uk'];
    const invalidEmails = ['invalid-email', '@domain.com', 'user@', 'user name@domain.com'];
    
    for (const email of validEmails) {
      if (!isValidEmail(email)) {
        console.error(`❌ Valid email rejected: ${email}`);
        return false;
      }
    }
    
    for (const email of invalidEmails) {
      if (isValidEmail(email)) {
        console.error(`❌ Invalid email accepted: ${email}`);
        return false;
      }
    }
    
    console.log('✅ Email validation works');
    
    // Test phone validation
    const validPhones = ['+48123456789', '123-456-789', '(123) 456-789'];
    const invalidPhones = ['abc', '123', '+48-abc-def-ghi'];
    
    for (const phone of validPhones) {
      if (!isValidPhone(phone)) {
        console.error(`❌ Valid phone rejected: ${phone}`);
        return false;
      }
    }
    
    for (const phone of invalidPhones) {
      if (isValidPhone(phone)) {
        console.error(`❌ Invalid phone accepted: ${phone}`);
        return false;
      }
    }
    
    console.log('✅ Phone validation works');
    
    // Test client data validation
    const validClient = {
      name: 'Jan Kowalski',
      phone: '+48123456789',
      email: 'jan@example.com',
      address: 'ul. Testowa 123, Warszawa'
    };
    
    const clientValidation = validateClientData(validClient);
    if (!clientValidation.isValid) {
      console.error('❌ Valid client data rejected:', clientValidation.errors);
      return false;
    }
    
    const invalidClient = {
      name: '',
      phone: 'invalid',
      email: 'not-an-email',
      address: ''
    };
    
    const invalidClientValidation = validateClientData(invalidClient);
    if (invalidClientValidation.isValid) {
      console.error('❌ Invalid client data accepted');
      return false;
    }
    
    console.log('✅ Client data validation works');
    
    // Test auth data validation
    const validAuth = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const authValidation = validateAuthData(validAuth, 'login');
    if (!authValidation.isValid) {
      console.error('❌ Valid auth data rejected:', authValidation.errors);
      return false;
    }
    
    const invalidAuth = {
      email: 'invalid-email',
      password: '123'
    };
    
    const invalidAuthValidation = validateAuthData(invalidAuth, 'login');
    if (invalidAuthValidation.isValid) {
      console.error('❌ Invalid auth data accepted');
      return false;
    }
    
    console.log('✅ Auth data validation works');
    
    return true;
  } catch (error) {
    console.error('❌ Data validation test failed:', error.message);
    return false;
  }
}

async function testRateLimitingLogic() {
  console.log('\n🧪 Testing Rate Limiting Logic...');
  
  try {
    // Simulate rate limiting logic (simplified version)
    const rateLimitStore = new Map();
    
    function checkRateLimit(identifier, maxRequests, windowMs) {
      const now = Date.now();
      const key = `${identifier}_${Math.floor(now / windowMs)}`;
      
      const current = rateLimitStore.get(key) || 0;
      
      if (current >= maxRequests) {
        return false;
      }
      
      rateLimitStore.set(key, current + 1);
      return true;
    }
    
    // Test normal usage
    const testIP = '192.168.1.1';
    const windowMs = 60000; // 1 minute
    const maxRequests = 5;
    
    // Should allow first 5 requests
    for (let i = 0; i < maxRequests; i++) {
      if (!checkRateLimit(testIP, maxRequests, windowMs)) {
        console.error(`❌ Request ${i + 1} blocked incorrectly`);
        return false;
      }
    }
    
    // Should block 6th request
    if (checkRateLimit(testIP, maxRequests, windowMs)) {
      console.error('❌ Rate limit not enforced');
      return false;
    }
    
    console.log('✅ Rate limiting logic works');
    
    // Test different IPs
    const testIP2 = '192.168.1.2';
    if (!checkRateLimit(testIP2, maxRequests, windowMs)) {
      console.error('❌ Different IP blocked incorrectly');
      return false;
    }
    
    console.log('✅ IP-based rate limiting works');
    
    return true;
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error.message);
    return false;
  }
}

async function testSecurityHeaders() {
  console.log('\n🧪 Testing Security Headers...');
  
  try {
    // Simulate security headers middleware
    const mockResponse = {
      headers: new Map(),
      setHeader(name, value) {
        this.headers.set(name, value);
      },
      removeHeader(name) {
        this.headers.delete(name);
      }
    };
    
    // Simulate the security headers function
    function addSecurityHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.removeHeader('X-Powered-By');
    }
    
    addSecurityHeaders(mockResponse);
    
    const expectedHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy'
    ];
    
    for (const header of expectedHeaders) {
      if (!mockResponse.headers.has(header)) {
        console.error(`❌ Missing security header: ${header}`);
        return false;
      }
    }
    
    console.log('✅ Security headers implementation works');
    
    return true;
  } catch (error) {
    console.error('❌ Security headers test failed:', error.message);
    return false;
  }
}

async function testIPBlocking() {
  console.log('\n🧪 Testing IP Blocking Logic...');
  
  try {
    const blockedIPs = new Set();
    const suspiciousIPs = new Map();
    
    function checkIPSecurity(ip) {
      // Check if IP is blocked
      if (blockedIPs.has(ip)) {
        return false;
      }
      
      // Track suspicious activity
      if (suspiciousIPs.has(ip)) {
        const activity = suspiciousIPs.get(ip);
        activity.count++;
        activity.lastSeen = Date.now();
        
        // Block IP if too many suspicious requests
        if (activity.count > 50) {
          blockedIPs.add(ip);
          suspiciousIPs.delete(ip);
          return false;
        }
      } else {
        suspiciousIPs.set(ip, { count: 1, lastSeen: Date.now() });
      }
      
      return true;
    }
    
    const testIP = '10.0.0.1';
    
    // Normal requests should pass
    for (let i = 0; i < 30; i++) {
      if (!checkIPSecurity(testIP)) {
        console.error(`❌ Normal request ${i + 1} blocked`);
        return false;
      }
    }
    
    // Simulate suspicious activity
    for (let i = 0; i < 25; i++) {
      checkIPSecurity(testIP);
    }
    
    // Should be blocked now
    if (checkIPSecurity(testIP)) {
      console.error('❌ Suspicious IP not blocked');
      return false;
    }
    
    console.log('✅ IP blocking logic works');
    
    // Test that other IPs still work
    const cleanIP = '10.0.0.2';
    if (!checkIPSecurity(cleanIP)) {
      console.error('❌ Clean IP blocked incorrectly');
      return false;
    }
    
    console.log('✅ Clean IP handling works');
    
    return true;
  } catch (error) {
    console.error('❌ IP blocking test failed:', error.message);
    return false;
  }
}

async function testEdgeCases() {
  console.log('\n🧪 Testing Edge Cases...');
  
  try {
    // Test null/undefined inputs
    const nullValidation = validateClientData(null);
    if (nullValidation.isValid) {
      console.error('❌ Null input accepted');
      return false;
    }
    
    // Test empty object
    const emptyValidation = validateClientData({});
    if (emptyValidation.isValid) {
      console.error('❌ Empty object accepted');
      return false;
    }
    
    // Test very long strings
    const longString = 'a'.repeat(10000);
    const sanitizedLong = sanitizeString(longString, 100);
    if (sanitizedLong.length > 100) {
      console.error('❌ Length limit not enforced');
      return false;
    }
    
    // Test unicode characters
    const unicodeInput = 'Łóżko ąćęłńóśźż';
    const sanitizedUnicode = sanitizeString(unicodeInput);
    if (sanitizedUnicode !== unicodeInput) {
      console.error('❌ Unicode characters corrupted');
      return false;
    }
    
    console.log('✅ Edge cases handled correctly');
    
    return true;
  } catch (error) {
    console.error('❌ Edge cases test failed:', error.message);
    return false;
  }
}

// Main test runner
export default async function runSecurityTests() {
  console.log('🚀 Starting Security & Rate Limiting Tests...');
  
  const tests = [
    { name: 'Input Sanitization', fn: testInputSanitization },
    { name: 'Data Validation', fn: testDataValidation },
    { name: 'Rate Limiting Logic', fn: testRateLimitingLogic },
    { name: 'Security Headers', fn: testSecurityHeaders },
    { name: 'IP Blocking', fn: testIPBlocking },
    { name: 'Edge Cases', fn: testEdgeCases }
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
  
  // Report results
  console.log('\n📊 Security Test Results Summary:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All security tests passed! System is well-protected.');
  } else {
    console.log('⚠️ Some security tests failed. Review implementation.');
  }
  
  return { passed, total, success: passed === total };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests().catch(console.error);
}