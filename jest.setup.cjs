const { inspect } = require('util');

inspect.defaultOptions.depth = 5;

/**
 * Enhanced circular reference replacer
 * Uses WeakSet to track objects and handles nested circular references
 */
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    // Skip problematic properties that often cause circular references
    if (key === 'req' || key === 'res' || key === 'parent' || key === 'socket' || 
        key === 'request' || key === 'response' || key === '_events' || key === '_eventsCount') {
      return '[Circular:SkippedProperty]';
    }
    
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular:Reference]';
      }
      seen.add(value);
    }
    return value;
  };
};

// Safer stringify that handles circular references
const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj, getCircularReplacer());
  } catch (error) {
    try {
      return JSON.stringify(inspect(obj, { depth: 2, breakLength: Infinity, customInspect: false }));
    } catch (innerError) {
      return JSON.stringify({ error: 'Failed to stringify object' });
    }
  }
};

// Patch JSON.stringify
const originalStringify = JSON.stringify;
JSON.stringify = function(obj, replacer, space) {
  try {
    if (replacer) {
      const combinedReplacer = (key, value) => {
        const circularHandled = getCircularReplacer()(key, value);
        if (circularHandled === '[Circular:Reference]' || circularHandled === '[Circular:SkippedProperty]') {
          return circularHandled;
        }
        return typeof replacer === 'function' ? replacer(key, circularHandled) : circularHandled;
      };
      return originalStringify(obj, combinedReplacer, space);
    }
    return originalStringify(obj, getCircularReplacer(), space);
  } catch (error) {
    if (error.message && error.message.includes('circular structure')) {
      return originalStringify(inspect(obj, { depth: 2, breakLength: Infinity, customInspect: false }));
    }
    throw error;
  }
};

// Patch process.send to handle circular references
if (process.send) {
  const originalSend = process.send;
  process.send = function(message) {
    try {
      return originalSend.call(this, message);
    } catch (error) {
      if (error.message && error.message.includes('circular structure')) {
        try {
          // Try to create a safe copy of the message
          const safeMessage = JSON.parse(safeStringify(message));
          return originalSend.call(this, safeMessage);
        } catch (innerError) {
          console.error('Failed to serialize message for process.send:', innerError);
          // Fallback to a minimal message
          const minimalMessage = {
            type: message.type || 'unknown',
            event: message.event || 'unknown',
            success: message.success !== undefined ? message.success : true,
            error: innerError.message || 'Unknown error'
          };
          return originalSend.call(this, minimalMessage);
        }
      }
      throw error;
    }
  };
}

// Mock fetch for tests
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
    headers: new Map(),
  })
);

// Patch console methods to reduce noise in test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn((...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Test:')) {
      originalConsoleLog(...args);
    }
  });
  
  console.error = jest.fn((...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Test:')) {
      originalConsoleError(...args);
    }
  });
  
  console.warn = jest.fn((...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Test:')) {
      originalConsoleWarn(...args);
    }
  });
}
