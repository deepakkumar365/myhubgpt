import { getNextWeekRange, getThisWeekRange } from '@/lib/utils/dateFilters';
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

export const getShipments = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
  'getShipments',
  `CRITICAL: This tool is EXCLUSIVELY for shipment-related queries. 
  
  FORBIDDEN: NEVER use this tool for:
  - "Track your Container" - Use getContainers instead
  - "Container tracking" - Use getContainers instead  
  - Any query containing "container" - Use getContainers instead
  
  ONLY use this tool for SHIPMENT queries like:
  - "Track your Shipment"
  - "Shipment tracking" 
  - "Track shipment"
  - Shipment-specific information
  
  Get shipments using a filter. This tool is for SHIPMENT-specific queries ONLY.

    If the user to ask to fetch the shipment contains a specific shipment number,
    filter: ShipmentNo eq 'SHP00185131'

    How many shipments are in transit?
    filter: ATD ne null and ATA eq null
    
    Get shipments that arrived today 
    filter: ATA eq 2025-04-10 use ${new Date().toISOString().split("T")[0]}  

    Get shipments that Departed today 
    filter: ATD eq 2025-04-10 use ${new Date().toISOString().split("T")[0]}
    
    How many shipments are at destination?
    filter: LastLegATA eq null and FirstLegATD ne null and ActualDeliveryDate eq null and ShipmentClosedDate eq null
    
    How many shipments are delayed?
    filter: ShipmentClosedDate eq null and ATA ne null and ATA gt ETA 

    How many shipments are At Origin?
    filter: ShipmentClosedDate eq null and ATD eq null
    
    How many shipments are arriving this week?
    filter: ShipmentClosedDate eq null and ATD ne null and ATA eq null and 
    ETA ge ${getThisWeekRange().start} and 
    ETA le ${getThisWeekRange().end}
    
    How many shipments are arriving next week?
    filter: ShipmentClosedDate eq null and ATD ne null and ATA eq null and
    ETA ge ${getNextWeekRange().start} and 
    ETA le ${getNextWeekRange().end}

    How many shipments are Departed this week?
    filter: ShipmentClosedDate eq null and ATD ne null and ATA eq null and 
    ATD ge ${getThisWeekRange().start} and 
    ATD le ${getThisWeekRange().end}

    How many shipments are in Booked But Cargo Not Received?
    filter: CargoReceiptDate eq null and ShipmentClosedDate eq null and ATD eq null and ATA eq null and ActualDeliveryDate eq null and EmptyReturnReadyOn eq null`,
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
    return executeODataQuery("ShipmentList", { filter, top, skip, orderby, count, apply }, enhancedOptions);
  }
);
