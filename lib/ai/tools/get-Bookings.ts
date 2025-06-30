import { executeODataQuery } from '@/lib/utils/odataHelpers';
import { createTool, CustomToolExecutionOptions } from '@/lib/utils/toolWrapper';
import { DataStreamWriter } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import { generateModuleText, getDateFilter } from '@/lib/utils/dateFilters';

interface CreateGetShipmentsProps {
    session: Session;
    dataStream: DataStreamWriter;
    authToken: string;
}

export const getYetToBeApprovedBooking = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
    'getYetToBeApprovedBooking',
    'Get list of bookings that are yet to be approved',
    z.object({
        top: z.number().optional().default(10).describe('The maximum number of items to retrieve.'),
        skip: z.number().optional().default(0).describe('The number of items to skip before starting to collect the result set.'),
        orderby: z.string().optional().default('BookingSubmittedDate desc').describe('The property to sort the results by.'),
    }),
    async ({ top = 10, skip = 0, orderby = 'BookingSubmittedDate desc' }: {
        top?: number;
        skip?: number;
        orderby?: string;
    }, options: CustomToolExecutionOptions) => {

        // Filter for bookings that are sent for approval (BSA status)
        const filter = `Status eq 'BSA'`;
        // Use our helper function to execute the query with error handling

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

        return executeODataQuery("BookingList", { filter, top, skip, orderby, count: true }, enhancedOptions);
    }
);

export const getBookings = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
    'getBookings',
    `Get booking using a filtered list of bookings.
            
            If the user to ask to fetch the booking contains a specific booking number,
            filter: BookingNo eq 'SHP00185131'

            How many Open Bookings are there?
            filter: EntityType eq 'BKG' and StateId ge 2000 and StateId le 2070

            how many bookings are In Draft?
            filter: EntityType eq 'BKG' and StateId ge 2000 and StateId le 2010

            how many bookings are received?
            filter: EntityType eq 'BKG' and StateId ge 2011 or StateId le 2020)

            how many bookings are sent for approval?
            filter: Status eq 'BSA'

            how many bookings are held for consolidation?
            filter: Status eq 'BHC' and HoldForConsolDate eq ${new Date().toISOString().split("T")[0]}

            how many bookings are held for consol?
            filter: Status eq 'BHC' and HoldForConsolDate eq ${new Date().toISOString().split("T")[0]}

            how many bookings are rejected?
            filter: Status eq 'BRD'

            how many bookings are Carrier to be Confirmed?
            filter: EntityType eq 'BKG' and StateId ge 2036 or StateId le 2040)

            how many Bookings are waiting for Docs?
            filter: EntityType eq 'BKG' and StateId ge 2051 or StateId le 2060)

            how many bookings are confirmed?
            filter: EntityType eq 'BKG' and StateId ge 2061 or StateId le 2070)

            Get booking that arrived today 
            filter: ATA eq ${new Date().toISOString().split("T")[0]}  

            Get booking that Departed today 
            filter: ATD eq ${new Date().toISOString().split("T")[0]}
            
            How many booking are arriving this week?
            filter: ShipmentClosedDate eq null and ATD ne null and ATA eq null and ${getDateFilter('ETA', 'thisweek')}
            
            How many booking are arriving next week?
            filter: ShipmentClosedDate eq null and ATD ne null and ATA eq null and ${getDateFilter('ETA', 'nextweek')}
        
            How many booking are Departed this week?
            filter: ShipmentClosedDate eq null and ATD ne null and ATA eq null and ${getDateFilter('ATD', 'thisweek')}
            
            ${generateModuleText('Booking', ['BookingSubmittedDate',])}

            `,
    z.object({
        filter: z.string().optional().describe('Filter expression for selecting specific bookings.'),
        top: z.number().optional().default(10).describe('The maximum number of items to retrieve.'),
        skip: z.number().optional().default(0).describe('The number of items to skip before starting to collect the result set.'),
        orderby: z.string().optional().describe('The property to sort the results by.'),
        count: z.boolean().optional().default(true).describe('Whether to include the total count of items in the response.'),
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
        return executeODataQuery("BookingList", { filter, top, skip, orderby, count, apply }, enhancedOptions);
    }
);