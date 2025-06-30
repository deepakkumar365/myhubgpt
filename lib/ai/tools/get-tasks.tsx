import { executeODataQuery } from '@/lib/utils/odataHelpers';
import { createTool, CustomToolExecutionOptions } from '@/lib/utils/toolWrapper';
import { DataStreamWriter } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import { translateFilterFields } from '@/lib/utils/fieldMappings';

interface CreateGetShipmentsProps {
    session: Session;
    dataStream: DataStreamWriter;
    authToken: string;
}

export const getTasks = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
    'getTasks',
    `Get Tasks tracking info by JobNo`,
    z.object({
        filter: z.string().optional().describe('Filter expression for selecting specific exception. Example: "KeyReference eq \'SHP00182882\'" or "Status eq \'Open\'"'),
        top: z.number().optional().default(10).describe("Maximum number of items to retrieve."),
        skip: z.number().optional().default(0).describe("Number of items to skip before starting to collect the result set."),
        orderby: z.string().optional().describe("Property name to sort the results by."),
        count: z.boolean().optional().default(false).describe("Whether to include the total count of matching tasks."),
        apply: z.string().optional().describe("OData apply expression to transform the result set.")
    }),
    async (
        {
            filter,
            top = 10,
            skip = 0,
            count = false,
            orderby,
            apply
        }: {
            filter?: string;
            top?: number;
            skip?: number;
            count?: boolean;
            orderby?: string;
            apply?: string;
        },
        options: CustomToolExecutionOptions
    ) => {


        // Translate user-friendly field names to actual API field names
        const translatedFilter = translateFilterFields('TaskList', filter);


        // Use the authToken passed from the client-side localStorage
        if (!authToken) {
            throw new Error('Authentication token is required but not provided');
        }

        // Create enhanced options with auth context
        const enhancedOptions: CustomToolExecutionOptions = {
            ...options,
            context: {
                ...options.context,
                authHeader: authToken,
                session,
            }
        };

        // Use our helper function to execute the query with error handling
        return executeODataQuery("TaskList", {
            filter: translatedFilter,
            top,
            skip,
            orderby,
            count,
            apply
        }, enhancedOptions);
    }
);
