const { inspect } = require('util');

inspect.defaultOptions.depth = 5;

/**
 * Enhanced circular reference replacer
 * Uses WeakSet to track objects and handles nested circular references
 */
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (key === 'req' || key === 'res' || key === 'parent' || key === 'socket') {
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

const originalStringify = JSON.stringify;
JSON.stringify = function(obj, replacer, space) {
  try {
    if (replacer) {
      const combinedReplacer = (key, value) => {
        const circularHandled = getCircularReplacer()(key, value);
        if (circularHandled === '[Circular:Reference]' || circularHandled === '[Circular:SkippedProperty]') {
          return circularHandled;
        }
        return replacer(key, circularHandled);
      };
      return originalStringify(obj, combinedReplacer, space);
    }
    return originalStringify(obj, getCircularReplacer(), space);
  } catch (error) {
    if (error.message.includes('circular structure')) {
      return originalStringify(inspect(obj, { depth: 2, breakLength: Infinity, customInspect: false }));
    }
    throw error;
  }
};

if (process.send) {
  const originalSend = process.send;
  process.send = function(message) {
    try {
      return originalSend.call(this, message);
    } catch (error) {
      if (error.message.includes('circular structure')) {
        try {
          const safeMessage = JSON.parse(JSON.stringify(message));
          return originalSend.call(this, safeMessage);
        } catch (innerError) {
          console.error('Failed to serialize message for process.send:', innerError);
          const minimalMessage = {
            type: message.type || 'unknown',
            event: message.event || 'unknown',
            success: message.success !== undefined ? message.success : true,
            error: innerError.message
          };
          return originalSend.call(this, minimalMessage);
        }
      }
      throw error;
    }
  };
}

global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
  })
);

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
