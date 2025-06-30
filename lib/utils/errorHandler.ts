import fs from 'fs';
import path from 'path';

/**
 * Standard error response interface for tool API calls
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

/**
 * Standard success response interface for tool API calls
 */
export interface SuccessResponse<T> {
  success: true;
  value: T;
  count?: number;
}

/**
 * Union type for all possible API responses
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Logs an error to a date-based log file and returns a standardized error response
 * 
 * @param error The error that occurred
 * @param context Additional context about where the error occurred
 * @param url Optional URL that was being accessed when the error occurred
 * @returns A standardized error response object
 */
export function handleApiError(error: unknown, context: string, url?: string): ErrorResponse {
  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Create a detailed log message
  const logMessage = `[${new Date().toISOString()}] ${context} error: ${errorMessage}${url ? ` | URL: ${url}` : ''}\n`;

  // Log to console
  console.error(logMessage);

  try {
    // Create a new log file for each date
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const logsDir = path.join(process.cwd(), 'logs');

    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFilePath = path.join(logsDir, `error-${currentDate}.log`);

    // Append to log file
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  } catch (logError) {
    console.error('Error writing to log file:', logError);
  }

  // Return standardized error response
  return {
    success: false,
    error: `An error occurred while processing your request: ${errorMessage}`,
    code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
  };
}

/**
 * Wraps a function with standardized error handling
 * 
 * @param fn The function to wrap with error handling
 * @param context The context description for error logging
 * @returns A function that returns a standardized response
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  context: string
): (...args: Args) => Promise<ApiResponse<T>> {
  return async (...args: Args) => {
    try {
      const result = await fn(...args);

      let count = 0;
      if (typeof result === 'object') {
        count = (result as any)['@odata.count'] || 0;
      }
      return {
        success: true,
        value: result,
        count
      };
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}