import { executeODataQuery } from '@/lib/utils/odataHelpers';
import { createTool, CustomToolExecutionOptions } from '@/lib/utils/toolWrapper';
import { DataStreamWriter } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import { generateModuleText } from '@/lib/utils/dateFilters';

interface CreateGetShipmentsProps {
  session: Session;
  dataStream: DataStreamWriter;
  authToken: string;
}

export const getOrders = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
  'getOrders',
  `Get and track orders using filters. Use this tool for order tracking, order status queries, purchase order management, and order-related information.
  
    This tool allows you to filter orders based on various criteria such as OrderNo, ShipmentNo, BookingNo, Container Number, and other order-related fields.
    The tool supports filtering by specific values or using the 'contains' function for partial matches.
    
    IMPORTANT INSTRUCTIONS:
    
    How many Open Orders are there?
     filter:IsPreadviceMailSent eq false and OrderType ne 'SO'

    How many Orders are in Transit?
     filter:FirstLegATD ne null and ATA eq null and OrderType ne 'SO' and ActualDeliveryDate eq null
    
    How many Orders are Arrived Not Delivered?
     filter:FirstLegATD ne null and LastLegATA ne null and OrderType ne 'SO' and ActualDeliveryDate eq null
    
    How many order are pending for vessel planning?
    filter:IsPreadviceMailSent eq true and OrderType ne 'SO' and POHSHPFK eq null

    how many orders are pending for supplier followup?
     filter:FollowupSentDate ne null and POHSHPFK eq null and OrderType ne 'SO'

    how many orders that are related to this container number?
     contains(ContainerNumbers, 'CON00138856')

    How many orders attached to this shipment number? or
    Is any orders attached to this bookings number?
     Note: If multiple shipment numbers are provided, use the 'or' operator to separate them.
     contains(ShipmentNo, 'SHP00185131') or contains(ShipmentNo, 'SHP00185132')
     
     ${generateModuleText('order')}`,

  z.object({
    filter: z.string().optional().describe('Filter expression for selecting specific shipments.'),
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
    return executeODataQuery("OrderList", { filter, top, skip, orderby, count, apply }, enhancedOptions);
  }
);

