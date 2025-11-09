/**
 * Global Error Handler
 * Centralized error handling with proper logging
 */

const logger = require('./logger');

/**
 * Custom error classes
 */
class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

class BlockchainError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'BlockchainError';
    this.originalError = originalError;
  }
}

class APIError extends Error {
  constructor(message, statusCode = 500, originalError = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

class ClaudeError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'ClaudeError';
    this.originalError = originalError;
  }
}

/**
 * Handle errors with proper logging and recovery
 */
function handleError(error, context = '') {
  const errorInfo = {
    name: error.name || 'Error',
    message: error.message,
    context,
    stack: error.stack,
  };

  // Log based on error type
  if (error instanceof DatabaseError) {
    logger.error(`Database error in ${context}:`, errorInfo);
  } else if (error instanceof BlockchainError) {
    logger.error(`Blockchain error in ${context}:`, errorInfo);
  } else if (error instanceof ClaudeError) {
    logger.error(`Claude API error in ${context}:`, errorInfo);
  } else if (error instanceof APIError) {
    logger.error(`API error in ${context}:`, errorInfo);
  } else {
    logger.error(`Unexpected error in ${context}:`, errorInfo);
  }

  return errorInfo;
}

/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Express error middleware
 */
function errorMiddleware(err, req, res, next) {
  const errorInfo = handleError(err, `${req.method} ${req.path}`);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      type: err.name || 'Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

/**
 * Retry function with exponential backoff
 */
async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry = null,
  } = options;

  let lastError;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        if (onRetry) {
          onRetry(error, attempt);
        }

        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, {
          error: error.message,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffMultiplier;
      }
    }
  }

  throw lastError;
}

/**
 * Safe JSON parse with error handling
 */
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    logger.warn('Failed to parse JSON:', { error: error.message, input: str });
    return fallback;
  }
}

module.exports = {
  // Error classes
  DatabaseError,
  BlockchainError,
  APIError,
  ClaudeError,

  // Error handlers
  handleError,
  asyncHandler,
  errorMiddleware,

  // Utilities
  retry,
  safeJsonParse,
};
