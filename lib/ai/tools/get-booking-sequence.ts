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

let BookingPK = "";

// Tool to fetch Booking details by Booking number
export const getBookingDetails = createTool(
    'getBookingDetails',
    'Get detailed information about a Booking by its Booking number',
    z.object({
        BookingNo: z.string().describe('The Booking number to look up'),
    }),
    async ({ BookingNo }: { BookingNo: string }, options: CustomToolExecutionOptions) => {

        const filter = `BookingNo eq '${BookingNo}'`;
        return executeODataQuery("BookingList", { filter }, options);
    }
);

// Tool to fetch order list related to a Booking
export const getOrderList = createTool(
    'getOrderList',
    'Get order list related to a Booking',
    z.object({
        BookingPK: z.string().describe('The primary key of the Booking'),
    }),
    async ({ BookingPK }: { BookingPK: string }, options: CustomToolExecutionOptions) => {

        const filter = `POHSHPFK eq ${BookingPK}`;
        return executeODataQuery("OrderList", { filter }, options);
    }
);

// Tool to fetch container list related to a Booking
export const getContainerList = createTool(
    'getContainerList',
    'Get container list related to a Booking',
    z.object({
        BookingNo: z.string().describe('The Booking number to look up'),
    }),
    async ({ BookingNo }: { BookingNo: string }, options: CustomToolExecutionOptions) => {

        const filter = `ShipmentNo eq '${BookingNo}'`;
        return executeODataQuery("ContainerList", { filter }, options);
    }
);

// Tool to fetch routing information related to a Booking
export const getRoutingInfo = createTool(
    'getRoutingInfo',
    'Get routing information related to a Booking',
    z.object({
        BookingPK: z.string().describe('The primary key of the Booking'),
    }),
    async ({ BookingPK }: { BookingPK: string }, options: CustomToolExecutionOptions) => {

        const filter = `EntityRefKey eq ${BookingPK}`;
        return executeODataQuery("JobroutesList", { filter }, options);
    }
);

// Tool to fetch address information related to a Booking
export const getAddressInfo = createTool(
    'getAddressInfo',
    'Get address information related to a Booking',
    z.object({
        BookingPK: z.string().describe('The primary key of the Booking'),
    }),
    async ({ BookingPK }: { BookingPK: string }, options: CustomToolExecutionOptions) => {

        const filter = `EntityRefKey eq ${BookingPK}`;
        return executeODataQuery("JobAddressList", { filter }, options);
    }
);

// Tool to fetch comments related to a Booking
export const getComments = createTool(
    'getComments',
    'Get comments related to a Booking',
    z.object({
        BookingPK: z.string().describe('The primary key of the Booking'),
    }),
    async ({ BookingPK }: { BookingPK: string }, options: CustomToolExecutionOptions) => {

        const filter = `EntityRefKey eq ${BookingPK}`;
        return executeODataQuery("CommentsList", { filter }, options);
    }
);

// Tool to fetch documents related to a Booking
export const getDocuments = createTool(
    'getDocuments',
    'Get documents related to a Booking',
    z.object({
        BookingPK: z.string().describe('The primary key of the Booking'),
    }),
    async ({ BookingPK }: { BookingPK: string }, options: CustomToolExecutionOptions) => {

        const filter = `SHPJODEntityRefKey eq ${BookingPK}`;
        return executeODataQuery("AllDocumentList", { filter }, options);
    }
);

// Tool to fetch exceptions related to a Booking
export const getExceptions = createTool(
    'getExceptions',
    'Get exceptions related to a Booking',
    z.object({
        BookingPK: z.string().describe('The primary key of the Booking'),
    }),
    async ({ BookingPK }: { BookingPK: string }, options: CustomToolExecutionOptions) => {

        const filter = `EntityRefKey eq ${BookingPK}`;
        return executeODataQuery("JobExceptionList", { filter }, options);
    }
);

// Tool to fetch Tasks related to a Booking
export const getTasks = createTool(
    'getTasks',
    'Get Tasks related to a Booking',
    z.object({
        BookingPK: z.string().describe('The primary key of the Booking'),
    }),
    async ({ BookingPK }: { BookingPK: string }, options: CustomToolExecutionOptions) => {

        const filter = `entityRefKey eq ${BookingPK}`;
        return executeODataQuery("TaskList", { filter }, options);
    }
);

// Main sequence tool that orchestrates the fetching of all related data
export const getBookingSequence = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
    'BookingSequence',
    'Get comprehensive information about a Booking including related orders, containers, routing, addresses, comments, documents, exceptions, and tasks',
    z.object({
        BookingNo: z.string().describe('The Booking number to look up'),
    }),
    async ({ BookingNo }: { BookingNo: string }, options: CustomToolExecutionOptions) => {


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

        // Step 1: Fetch Booking details
        const bookingDetailsResult = await getBookingDetails.execute({ BookingNo }, enhancedOptions);

        if (!bookingDetailsResult.success || !bookingDetailsResult.value || bookingDetailsResult.value.length === 0) {
            return {
                success: false,
                error: 'Booking not found',
                value: [],
                count: 0
            };
        }

        const bookingDetails = Array.isArray(bookingDetailsResult.value) ? bookingDetailsResult.value[0] : bookingDetailsResult.value;

        // Extract the primary key for related data queries
        BookingPK = bookingDetails.SHPPK || '';
        const currentBookingNo = bookingDetails.BookingNo || '';

        if (!BookingPK) {
            return {
                success: true,
                value: {
                    bookingDetails,
                    error: 'Could not find primary key for related data'
                },
                count: 1
            };
        }

        // Step 2: Fetch related data in parallel
        const [
            orderListResult,
            containerListResult,
            routingInfoResult,
            addressInfoResult,
            commentsResult,
            documentsResult,
            exceptionsResult,
            tasksResult
        ] = await Promise.all([
            getOrderList.execute({ BookingPK }, enhancedOptions),
            getContainerList.execute({ BookingNo: currentBookingNo }, enhancedOptions),
            getRoutingInfo.execute({ BookingPK }, enhancedOptions),
            getAddressInfo.execute({ BookingPK }, enhancedOptions),
            getComments.execute({ BookingPK }, enhancedOptions),
            getDocuments.execute({ BookingPK }, enhancedOptions),
            getExceptions.execute({ BookingPK }, enhancedOptions),
            getTasks.execute({ BookingPK }, enhancedOptions)
        ]);

        // Return all the data
        return {
            success: true,
            value: {
                bookingDetails,
                orderList: orderListResult.success ? orderListResult.value : [],
                containerList: containerListResult.success ? containerListResult.value : [],
                routingInfo: routingInfoResult.success ? routingInfoResult.value : [],
                addressInfo: addressInfoResult.success ? addressInfoResult.value : [],
                comments: commentsResult.success ? commentsResult.value : [],
                documents: documentsResult.success ? documentsResult.value : [],
                exceptions: exceptionsResult.success ? exceptionsResult.value : [],
                tasks: tasksResult.success ? tasksResult.value : []
            },
            count: 1
        };
    }
);