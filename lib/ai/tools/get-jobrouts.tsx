import { executeODataQuery } from '@/lib/utils/odataHelpers';
import { createTool, CustomToolExecutionOptions } from '@/lib/utils/toolWrapper';
import { DataStreamWriter } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import { translateFilterFields } from '@/lib/utils/fieldMappings';

interface CreateGetJobroutsProps {
    session: Session;
    dataStream: DataStreamWriter;
    authToken: string;
}

export const getJobrouts = ({ session, dataStream, authToken }: CreateGetJobroutsProps) => createTool(
    'getJobrouts',
    `Get jobrouts using a filter
    
    if you are asked to fetch the jobrouts contains a specific jobno
    filter: ShipmentNo eq 'SHP00185131' or Contains(ShipmentNo, 'SHP00185131') or ConsolNo eq 'SHP00185131' or Contains(ConsolNo, 'SHP00185131')
    `,
    z.object({
        filter: z.string().optional().describe('Filter expression for selecting specific jobrouts.'),
        top: z.number().optional().default(10).describe('The maximum number of items to retrieve.'),
        skip: z.number().optional().default(0).describe('The number of items to skip before starting to collect the result set.'),
        orderby: z.string().optional().describe('The property to sort the results by.'),
        count: z.boolean().optional().default(false).describe('Whether to include the total count of items in the response.'),
        apply: z.string().optional().describe('An expression used to apply transformations to the result set.')
    }),
    async ({ filter, top = 10, skip = 0, count = false, orderby, apply }: {
        filter?: string;
        top?: number;
        skip?: number;
        count?: boolean;
        orderby?: string;
        apply?: string
    }, options: CustomToolExecutionOptions) => {

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

        let query = "";
        const shipmentRes = await executeODataQuery("ShipmentList", {
            filter,
            top,
            skip,
            orderby,
            count,
            apply
        }, enhancedOptions);

        let consolPK = "";
        let shipmentPK = "";

        if (shipmentRes.value.length > 0) {
            consolPK = shipmentRes.value[0].CONPK;
            shipmentPK = shipmentRes.value[0].REPPK;
        }
        if (consolPK) {
            query = `EntityRefKey eq ${consolPK}`;
        } else if (shipmentPK) {
            query = `EntityRefKey eq ${shipmentPK}`;
        } else if (consolPK && shipmentPK) {
            query = `EntityRefKey  eq ${consolPK} or EntityRefKey eq ${shipmentPK}`;
        } else {
            query = `${filter}`;
        }

        // Use our helper function to execute the query with error handling
        return executeODataQuery("JobroutesList", {
            filter: query,
            top,
            skip,
            orderby,
            count,
            apply
        }, enhancedOptions);
    }
);


