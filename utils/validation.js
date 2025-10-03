/**
 * 🛡️ INPUT VALIDATION & SANITIZATION UTILITIES
 * Professional-grade data validation and security
 */

// Input sanitization functions
export function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    // Remove potentially dangerous characters and HTML tags
    .replace(/<[^>]*>/g, '')
    .replace(/[\"']/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .slice(0, 254) // RFC 5321 limit
    .replace(/[^a-z0-9@._-]/g, '');
}

export function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  
  return phone
    .trim()
    .replace(/[^0-9+\-\s()]/g, '')
    .slice(0, 20);
}

export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validation functions
export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[0-9\-\s\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

export function isValidPassword(password) {
  // At least 6 characters, at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password) && password.length <= 128;
}

export function isValidName(name) {
  // Only letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-ZĄĆĘŁŃÓŚŹŻąćęłńóśźż\s\-']{1,100}$/;
  return nameRegex.test(name);
}

export function isValidAddress(address) {
  // Basic address validation - letters, numbers, spaces, common punctuation
  const addressRegex = /^[a-zA-ZĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9\s\.,\-\/]{5,200}$/;
  return addressRegex.test(address);
}

export function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && 
         date.getFullYear() >= 2020 && date.getFullYear() <= 2030;
}

export function isValidId(id) {
  // Allow numeric IDs or UUIDs or our custom format (#0001)
  const idRegex = /^(#\d{4}|\d+|[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9\-_]{1,50})$/;
  return idRegex.test(id);
}

// Schema validation for common objects
export function validateClientData(data) {
  const errors = [];
  
  // Handle null/undefined input
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format'],
      sanitized: {}
    };
  }
  
  if (!data.name || !isValidName(data.name)) {
    errors.push('Invalid name format');
  }
  
  if (!data.phone || !isValidPhone(data.phone)) {
    errors.push('Invalid phone format');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (data.address && !isValidAddress(data.address)) {
    errors.push('Invalid address format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: data.name ? sanitizeString(data.name, 100) : '',
      phone: data.phone ? sanitizePhone(data.phone) : '',
      email: data.email ? sanitizeEmail(data.email) : '',
      address: data.address ? sanitizeString(data.address, 200) : '',
      city: data.city ? sanitizeString(data.city, 50) : '',
      street: data.street ? sanitizeString(data.street, 100) : ''
    }
  };
}

export function validateOrderData(data) {
  const errors = [];
  
  if (!data.clientId || !isValidId(data.clientId)) {
    errors.push('Invalid client ID');
  }
  
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Category is required');
  }
  
  if (!data.description || data.description.length < 5) {
    errors.push('Description must be at least 5 characters');
  }
  
  if (data.scheduledDate && !isValidDate(data.scheduledDate)) {
    errors.push('Invalid scheduled date');
  }
  
  if (data.status && !['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(data.status)) {
    errors.push('Invalid status value');
  }
  
  if (data.priority && !['low', 'normal', 'high', 'urgent'].includes(data.priority)) {
    errors.push('Invalid priority value');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      clientId: data.clientId,
      category: sanitizeString(data.category, 50),
      serviceType: sanitizeString(data.serviceType || '', 100),
      description: sanitizeString(data.description, 1000),
      scheduledDate: data.scheduledDate,
      scheduledTime: sanitizeString(data.scheduledTime || '', 20),
      status: data.status || 'pending',
      priority: data.priority || 'normal',
      availability: sanitizeString(data.availability || '', 200)
    }
  };
}

export function validateAuthData(data, type = 'login') {
  const errors = [];
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (type === 'register') {
    if (!data.name || !isValidName(data.name)) {
      errors.push('Valid name is required');
    }
    
    if (!isValidPassword(data.password)) {
      errors.push('Password must contain at least one letter and one number');
    }
    
    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      email: sanitizeEmail(data.email),
      password: data.password, // Don't sanitize passwords
      name: type === 'register' ? sanitizeString(data.name, 100) : undefined
    }
  };
}

// File upload validation
export function validateFileUpload(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }
  
  // Check file name
  if (!/^[a-zA-Z0-9\-_\.\s]{1,255}$/.test(file.name)) {
    errors.push('Invalid file name format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: sanitizeString(file.name.replace(/[^a-zA-Z0-9\-_\.]/g, '_'), 255),
      size: file.size,
      type: file.type
    }
  };
}

// API request validation middleware
export function validateApiRequest(schema) {
  return (req, res, next) => {
    try {
      const validation = schema(req.body);
      
      if (!validation.isValid) {
        console.log(`🚫 Validation failed for ${req.method} ${req.url}:`, validation.errors);
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.errors
        });
      }
      
      // Replace request body with sanitized data
      req.body = validation.sanitized;
      next();
    } catch (error) {
      console.error('🚫 Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Internal validation error'
      });
    }
  };
}

// XSS protection
export function preventXSS(obj) {
  if (typeof obj === 'string') {
    return sanitizeHTML(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(preventXSS);
  }
  
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = preventXSS(value);
    }
    return cleaned;
  }
  
  return obj;
}

export default {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeHTML,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidName,
  isValidAddress,
  isValidDate,
  isValidId,
  validateClientData,
  validateOrderData,
  validateAuthData,
  validateFileUpload,
  validateApiRequest,
  preventXSS
};