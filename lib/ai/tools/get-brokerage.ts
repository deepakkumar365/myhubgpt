import { generateModuleText, getDateFilter, getNextWeekRange, getThisWeekRange } from '@/lib/utils/dateFilters';
import { executeODataQuery } from '@/lib/utils/odataHelpers';
import { createTool, CustomToolExecutionOptions } from '@/lib/utils/toolWrapper';
import { DataStreamWriter } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';

interface CreateGetShipmentsProps {
    session: Session;
    dataStream: DataStreamWriter;
    authToken: string;
}

export const getBrokerages = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
    'getBrokerages',
    `Get brokerage using a filter

    If the user to ask to fetch the brokerage contains a specific brokerage number,
    filter: BrokerageNo eq 'SHP00185131' | Contains(BrokerageNo, 'SHP00185131')


    How many brokerage are in transit?
    filter: ATD ne null and ATA eq null
    
    Get brokerage that arrived today 
    filter: ATA eq 2025-04-10 use ${new Date().toISOString().split('T')[0]}

    To fetch To Be Arrived (Brokerages)
    filter: ATD ne null and ImportCustomClearanceCompletedDate eq null and DeliveryCartageCompleted eq null and EmptyReturnReadyOn eq null

    To fetch containers the To Be Empty Returned or 'Containers for Return' (Brokerage)
    filter: DeliveryCartageCompleted eq null and EmptyCartageCompleted eq null and PackingMode in ('FCL','BCN')

    To fetch to be customs Cleared (Brokerage)
    filter: DeclarationEntryNO ne null and DeclarationEntryStatusNotEquals eq ATD and DeliveryCartageCompleted eq null and EmptyCartageCompleted eq null
    
    To fetch to be customs filed (Brokerage)
    filter: DeclarationEntryNO eq null and DeliveryCartageCompleted eq null and EmptyReturnReadyOn eq null and ATD eq null

    To fetch brokerage To Be Delivered (Brokerage)
    filter: DeliveryCartageCompleted eq null and DeclarationEntryStatus eq 'ATD' and ATA eq null

    To fetch brokerage Arriving This Week (Brokerage)
    filter: ATD eq null and ETA ne null and ${getDateFilter('ETA', 'thisweek')}

    To fetch brokerage Arriving This Month (Brokerage)
    filter: ATD eq null and ETA ne null and ${getDateFilter('ETA', 'thismonth')}

    To fetch brokerage Arriving Next Week (Brokerage)
    filter: ATD eq null and ETA ne null and ${getDateFilter('ETA', 'nextweek')}

    If containerno or Containers is used, apply a filter using the Containers field.
    filter: Contains(Containers, 'CON00138856')

    If orderno or OrderNos is used, apply a filter using the OrderNos field.
    filter: Contains(OrderNos, '1234567890')

    ${generateModuleText('brokerage', [
        'CargoReceiptDate',
        'ImportCustomClearanceCompletedDate',
        'DeliveryCartageCompleted'
    ])}`,
    z.object({
        filter: z.string().optional().describe('Filter expression for selecting specific shipments.'),
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
        return executeODataQuery("BrokerageList", { filter, top, skip, orderby, count, apply }, enhancedOptions);
    }
);