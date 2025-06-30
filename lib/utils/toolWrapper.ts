import { tool } from 'ai';
import * as z from 'zod';
import { ApiResponse, handleApiError } from './errorHandler';
import type { ToolExecutionOptions as AIToolExecutionOptions } from 'ai';

// Define our custom tool execution options that extends the AI SDK's type
export interface CustomToolExecutionOptions extends AIToolExecutionOptions {
    context?: {
        authHeader?: string;
        [key: string]: any;
    };
}

/**
 * Creates a tool with standardized error handling
 * 
 * @param name The name of the tool for error logging
 * @param description The description of the tool
 * @param parameters The Zod schema for the tool parameters
 * @param executeFn The function to execute
 * @returns A tool with standardized error handling
 */
export function createTool<TParams extends Record<string, any>, TResult>(
    name: string,
    description: string,
    parameters: z.ZodType<TParams>,
    executeFn: (params: TParams, options: CustomToolExecutionOptions) => Promise<TResult>
) {
    return tool({
        description,
        parameters,
        execute: async (params: TParams, options: CustomToolExecutionOptions) => {
            try {

                const result = await executeFn(params, options);

                // If the result is already in our ApiResponse format, return it directly
                if (result && typeof result === 'object' && 'success' in result) {
                    return result;
                }

                // Otherwise, wrap it in a success response
                // Safely extract the count if it exists
                let count = 0;
                if (typeof result === 'object') {
                    count = (result as any)['@odata.count'] || 0;
                }

                return {
                    success: true,
                    value: Array.isArray(result)
                        ? result
                        : (result as any).value !== undefined
                            ? (result as any).value
                            : result,
                    count
                };
            } catch (error) {
                // Handle and log the error
                const errorResponse = handleApiError(error, `Tool: ${name}`);

                // For AI tools, we need to return a specific format that the AI can understand
                return {
                    success: false,
                    error: errorResponse.error,
                    value: [],
                    count: 0
                };
            }
        }
    });
}