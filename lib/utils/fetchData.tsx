import { handleApiError } from './errorHandler';
import fs from 'fs';
import path from 'path';

/**
 * Fetches data from an OData endpoint with standardized error handling
 * 
 * @param endpoint The OData endpoint to fetch from
 * @param authHeader Optional authorization header
 * @returns The parsed JSON response
 */
export async function fetchOData(endpoint: string, authHeader?: string) {
    const url = `${process.env.NEXT_PUBLIC_ODATA_BASE_URL}/${endpoint}`;
    const authorization = authHeader || "";

    console.log("Fetching OData:", url);
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authorization,
                Accept: 'application/json',
            },
        });

        // Handle HTTP errors with specific messages
        if (!res.ok) {
            let errorBody = '';
            try {
                // Try to get more detailed error information from the response body
                errorBody = await res.text();
            } catch (e) {
                console.error('Failed to read error response body:', e);
            }

            const errorDetails = errorBody ? ` Details: ${errorBody}` : '';
            let errorMessage: string;

            switch (res.status) {
                case 400:
                    errorMessage = `Bad Request: The server could not understand the request.${errorDetails}`;
                    break;
                case 401:
                    errorMessage = `Unauthorized: Invalid or missing authorization header.${errorDetails}`;
                    break;
                case 403:
                    errorMessage = `Forbidden: You do not have permission to access this resource.${errorDetails}`;
                    break;
                case 404:
                    errorMessage = `Not Found: The requested resource could not be found.${errorDetails}`;
                    break;
                case 500:
                    errorMessage = `Internal Server Error: The server encountered an error.${errorDetails}`;
                    break;
                case 503:
                    errorMessage = `Service Unavailable: The server is currently unavailable.${errorDetails}`;
                    break;
                default:
                    errorMessage = `OData error: ${res.status} ${res.statusText}${errorDetails}`;
            }

            const error = new Error(errorMessage);
            (error as any).status = res.status;
            (error as any).statusText = res.statusText;
            throw error;
        }

        const json = await res.text();
        try {
            console.log('Response received successfully');
            return JSON.parse(json);
        } catch (parseError) {
            throw new Error(`Invalid JSON response: ${json.substring(0, 100)}...`);
        }
    } catch (error) {
        // Create a new log file for each date
        const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const logFilePath = path.join(process.cwd(), `logs/error-${currentDate}.log`);
        const errorMessage = `[${new Date().toISOString()}] fetchOData error: ${error instanceof Error ? error.message : String(error)
            } | URL: ${url}\n`; // Include the URL in the log

        fs.appendFile(logFilePath, errorMessage, (err: NodeJS.ErrnoException | null) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        });

        // Rethrow the error with a user-friendly message
        throw new Error(
            `Failed to fetch OData: ${error instanceof Error ? error.message : String(error)
            } | URL: ${url}`
        );
    }
}
