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

// OPTIMIZATIONS APPLIED:
// 1. Removed global variables for better concurrency safety
// 2. Enhanced tool descriptions for better AI recognition
// 3. Local variable scoping instead of global state
// 4. Improved error handling patterns

// Tool to fetch shipment details by shipment number
export const getShipmentDetails = createTool(
    'ShipmentList',
    'Get detailed information about a shipment by its shipment number',
    z.object({
        shipmentNo: z.string().describe('The shipment number to look up'),
    }),
    async ({ shipmentNo }: { shipmentNo: string }, options: CustomToolExecutionOptions) => {
        const filter = `ShipmentNo eq '${shipmentNo}'`;
        return executeODataQuery("ShipmentList", { filter }, options);
    }
);

// Tool to fetch order list related to a shipment
export const getOrderList = createTool(
    'OrderList',
    'Get order list related to a shipment',
    z.object({
        shipmentPK: z.string().describe('The primary key of the shipment'),
    }),
    async ({ shipmentPK }: { shipmentPK: string }, options: CustomToolExecutionOptions) => {
        const filter = `POHSHPFK eq ${shipmentPK}`;
        return executeODataQuery("OrderList", { filter }, options);
    }
);

// Tool to fetch container list related to a shipment
export const getContainerList = createTool(
    'ContainerList',
    'Get container list related to a shipment',
    z.object({
        shipmentNo: z.string().describe('The shipment number to look up'),
    }),
    async ({ shipmentNo }: { shipmentNo: string }, options: CustomToolExecutionOptions) => {
        const filter = `ShipmentNo eq '${shipmentNo}'`;
        return executeODataQuery("ContainerList", { filter }, options);
    }
);

// Tool to fetch routing information related to a shipment
export const getRoutingInfo = createTool(
    'JobroutesList',
    'Get routing information related to a shipment',
    z.object({
        shipmentPK: z.string().describe('The primary key of the shipment'),
        consolpk: z.string().describe('The primary key of the consolidation'),
    }),
    async ({ shipmentPK, consolpk }: { shipmentPK: string; consolpk: string }, options: CustomToolExecutionOptions) => {
        let filter = "";
        if (consolpk !== "") {
            filter = `EntityRefKey eq ${consolpk}`;
        }
        else if (shipmentPK !== "") {
            filter = `EntityRefKey eq ${shipmentPK}`;
        }
        else if (shipmentPK !== "" && consolpk !== "") {
            filter = `EntityRefKey eq ${shipmentPK} or EntityRefKey eq ${consolpk}`;
        }
        return executeODataQuery("JobroutesList", { filter }, options);
    }
);

// Tool to fetch address information related to a shipment
export const getAddressInfo = createTool(
    'JobAddressList',
    'Get address information related to a shipment',
    z.object({
        shipmentPK: z.string().describe('The primary key of the shipment'),
    }),
    async ({ shipmentPK }: { shipmentPK: string }, options: CustomToolExecutionOptions) => {
        const filter = `EntityRefKey eq ${shipmentPK}`;
        return executeODataQuery("JobAddressList", { filter }, options);
    }
);

// Tool to fetch comments related to a shipment
export const getComments = createTool(
    'CommentsList',
    'Get comments related to a shipment',
    z.object({
        shipmentPK: z.string().describe('The primary key of the shipment'),
    }),
    async ({ shipmentPK }: { shipmentPK: string }, options: CustomToolExecutionOptions) => {
        const filter = `EntityRefKey eq ${shipmentPK}`;
        return executeODataQuery("CommentsList", { filter }, options);
    }
);

// Tool to fetch documents related to a shipment
export const getDocuments = createTool(
    'JobDocumentsList',
    'Get documents related to a shipment',
    z.object({
        shipmentPK: z.string().describe('The primary key of the shipment'),
    }),
    async ({ shipmentPK }: { shipmentPK: string }, options: CustomToolExecutionOptions) => {
        const filter = `EntityRefKey eq ${shipmentPK}`;
        return executeODataQuery("JobDocumentsList", { filter }, options);
    }
);

// Tool to fetch exceptions related to a shipment
export const getExceptions = createTool(
    'JobExceptionList',
    'Get exceptions related to a shipment',
    z.object({
        shipmentPK: z.string().describe('The primary key of the shipment'),
    }),
    async ({ shipmentPK }: { shipmentPK: string }, options: CustomToolExecutionOptions) => {
        const filter = `EntityRefKey eq ${shipmentPK}`;
        return executeODataQuery("JobExceptionList", { filter }, options);
    }
);

// Tool to fetch Tasks related to a shipment
export const getTasks = createTool(
    'TaskList',
    'Get Tasks related to a shipment',
    z.object({
        shipmentPK: z.string().describe('The primary key of the shipment'),
    }),
    async ({ shipmentPK }: { shipmentPK: string }, options: CustomToolExecutionOptions) => {
        const filter = `entityRefKey eq ${shipmentPK}`;
        return executeODataQuery("TaskList", { filter }, options);
    }
);

// Main sequence tool that orchestrates the fetching of all related data
export const getShipmentSequence = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
    'getShipmentSequence',
    'Show complete shipment details, comprehensive shipment information, full shipment data including all related orders, containers, routing, addresses, comments, documents, exceptions, and tasks. Use this when user asks for complete/full/comprehensive shipment details or wants to see all shipment information.',
    z.object({
        shipmentNo: z.string().describe('The shipment number to look up and show complete details for. ALWAYS REQUIRED - ask user for shipment number if not provided when they request complete/comprehensive/full shipment details.'),
    }),
    async ({ shipmentNo }: { shipmentNo: string }, options: CustomToolExecutionOptions) => {
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
        
        // Step 1: Fetch shipment details
        const shipmentDetailsResult = await getShipmentDetails.execute({ shipmentNo }, enhancedOptions);

        if (!shipmentDetailsResult.success || !shipmentDetailsResult.value || shipmentDetailsResult.value.length === 0) {
            return {
                success: false,
                error: 'Shipment not found',
                value: [],
                count: 0
            };
        }

        const shipmentDetails = Array.isArray(shipmentDetailsResult.value) ? shipmentDetailsResult.value[0] : shipmentDetailsResult.value;

        // Extract the primary key for related data queries (local scope)
        const shipmentPK = shipmentDetails.REPPK || '';
        const currentShipmentNo = shipmentDetails.ShipmentNo || '';
        const consolpk = shipmentDetails.CONPK || '';

        if (!shipmentPK) {
            return {
                success: true,
                value: {
                    shipmentDetails,
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
            getOrderList.execute({ shipmentPK }, enhancedOptions),
            getContainerList.execute({ shipmentNo: currentShipmentNo }, enhancedOptions),
            getRoutingInfo.execute({ shipmentPK, consolpk }, enhancedOptions),
            getAddressInfo.execute({ shipmentPK }, enhancedOptions),
            getComments.execute({ shipmentPK }, enhancedOptions),
            getDocuments.execute({ shipmentPK }, enhancedOptions),
            getExceptions.execute({ shipmentPK }, enhancedOptions),
            getTasks.execute({ shipmentPK }, enhancedOptions)
        ]);

        // Prepare comprehensive shipment data in a clear, AI-friendly format
        const comprehensiveData = {
            shipmentInfo: {
                title: `Complete Shipment Details for ${currentShipmentNo}`,
                shipmentNumber: currentShipmentNo,
                details: shipmentDetails
            },
            relatedData: {
                orders: {
                    title: "Related Orders",
                    count: (orderListResult.success && orderListResult.value) ? orderListResult.value.length : 0,
                    data: orderListResult.success ? orderListResult.value : []
                },
                containers: {
                    title: "Related Containers", 
                    count: (containerListResult.success && containerListResult.value) ? containerListResult.value.length : 0,
                    data: containerListResult.success ? containerListResult.value : []
                },
                routing: {
                    title: "Routing Information",
                    count: (routingInfoResult.success && routingInfoResult.value) ? routingInfoResult.value.length : 0,
                    data: routingInfoResult.success ? routingInfoResult.value : []
                },
                addresses: {
                    title: "Address Information",
                    count: (addressInfoResult.success && addressInfoResult.value) ? addressInfoResult.value.length : 0,
                    data: addressInfoResult.success ? addressInfoResult.value : []
                },
                comments: {
                    title: "Comments",
                    count: (commentsResult.success && commentsResult.value) ? commentsResult.value.length : 0,
                    data: commentsResult.success ? commentsResult.value : []
                },
                documents: {
                    title: "Documents",
                    count: (documentsResult.success && documentsResult.value) ? documentsResult.value.length : 0,
                    data: documentsResult.success ? documentsResult.value : []
                },
                exceptions: {
                    title: "Exceptions",
                    count: (exceptionsResult.success && exceptionsResult.value) ? exceptionsResult.value.length : 0,
                    data: exceptionsResult.success ? exceptionsResult.value : []
                },
                tasks: {
                    title: "Tasks", 
                    count: (tasksResult.success && tasksResult.value) ? tasksResult.value.length : 0,
                    data: tasksResult.success ? tasksResult.value : []
                }
            }
        };

        const result = {
            success: true,
            value: comprehensiveData,
            count: 1,
            '@odata.count': 1
        };
        
        return result;
    }
);