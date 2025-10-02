/**
 * Retry logic for network operations
 */

/**
 * Execute an operation with exponential backoff retry logic
 *
 * @param operation - The async operation to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Initial delay in milliseconds (default: 1000)
 * @returns The result of the operation
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err as Error;

      // Don't retry on permission errors or validation errors
      if (
        lastError.message.includes('permission') ||
        lastError.message.includes('PERMISSION_DENIED') ||
        lastError.message.includes('invalid') ||
        lastError.message.includes('validation')
      ) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      const waitTime = delayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms`);
    }
  }

  throw lastError;
}

/**
 * Execute an operation with simple retry (fixed delay)
 *
 * @param operation - The async operation to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Delay between retries in milliseconds (default: 1000)
 * @returns The result of the operation
 * @throws The last error if all retries fail
 */
export async function withSimpleRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err as Error;

      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries}`);
    }
  }

  throw lastError;
}
