import { generateModuleText, getNextWeekRange, getThisWeekRange } from '@/lib/utils/dateFilters';
import { executeODataQuery } from '@/lib/utils/odataHelpers';
import { createTool, CustomToolExecutionOptions } from '@/lib/utils/toolWrapper';
import { DataStreamWriter } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
interface CreateGetContainersProps {
    session: Session;
    dataStream: DataStreamWriter;
    authToken: string;
}

export const getContainers = ({ session, dataStream, authToken }: CreateGetContainersProps) => createTool(
    'getContainers',
    `🚨 CONTAINER TOOL - EXCLUSIVE USE ONLY 🚨

    THIS TOOL IS THE ONLY CORRECT TOOL FOR CONTAINER QUERIES.
    
    ✅ USE THIS TOOL FOR:
    - "Track your Container"
    - "Track your Container?"
    - "Container tracking"
    - "Track container" 
    - "Container status"
    - "Show containers"
    - "Container details"
    - ANY question with the word "container"
    
    ❌ NEVER USE getShipments FOR CONTAINER QUERIES - IT'S WRONG!
    ❌ NEVER USE getOrders FOR CONTAINER QUERIES - IT'S WRONG!
    ❌ NEVER USE getBookings FOR CONTAINER QUERIES - IT'S WRONG!
    
    If you use the wrong tool for container queries, you will fail the task.
    
    Get and track containers using filters. This tool provides container-specific data ONLY.

    If the user asks to track containers or fetch containers with a specific container number,
    filter: ContainerNo eq 'SHP00185131'

    IMPORTANT: Exclude the containerNo.

    How many containers are in transit?
    filter: ATD ne null and ATA eq null and ActualDelivery eq null

    How many containers are at origin?
    filter: ATD eq null

    How many containers are arriving this week?
    filter: ATD ne null and ATA eq null and ActualDelivery eq null and ETA ge ${getNextWeekRange().start} and ETA le ${getNextWeekRange().end}

    How many containers are arriving next week?
    filter: ATD ne null and ATA eq null and ActualDelivery eq null and ETA ge ${getNextWeekRange().start} and ETA le ${getNextWeekRange().end}

    How many containers are at destination?
    filter: ATD ne null and ATA ne null and ActualDelivery eq null

    How many containers are delivered?
    filter: ActualDelivery ne null

    How many containers are yet to be delivered?
    filter: ActualDelivery eq null

    How many containers requested for delivery?
    filter: RequestedDelivery ne null

    How many empty containers have been requested for return?
    filter: Status eq 'Empty Return Requested'

    How many empty containers are returned?
    filter: Status eq 'Empty Returned'

    Get containers that arrived today 
    filter: ATA eq 2025-04-10 use ${new Date().toISOString().split('T')[0]}
    
    ${generateModuleText('container')}`,
    z.object({
        filter: z.string().optional().describe('Filter expression for selecting specific containers.'),
        top: z.number().optional().default(10).describe('The maximum number of items to retrieve.'),
        skip: z.number().optional().default(0).describe('The number of items to skip before starting to collect the result set.'),
        orderby: z.string().optional().describe('The property to sort the results by.'),
        count: z.boolean().optional().default(false).describe('Whether to include the total count of items in the response.'),
        apply: z.string().optional().describe('An expression used to apply transformations to the result set.')
    }),

    async ({ filter, top = 10, skip = 0, count = true, orderby, apply }: {
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

        // Use our helper function to execute the query with error handling
        return executeODataQuery("ContainerList", {
            filter,
            top,
            skip,
            orderby,
            count,
            apply
        }, enhancedOptions);
    }

)
