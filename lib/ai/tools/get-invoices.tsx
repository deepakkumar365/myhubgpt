import { generateModuleText } from '@/lib/utils/dateFilters';
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

export const getInvoices = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
  'getInvoices',
  `Get invoice using a filter

    If ShipmentNo or ShipmentNo is used, apply a filter using the ShipmentNo field.
    filter: eq 'ShipmentNo' or 'ShipmentNo' eq 'SHP00185131'

    If ContainerNo or ContainerNo is used, apply a filter using the ContainerNo field.
    filter: Contains(ContainerNo, 'CON00138856')

    If orderno or OrderNos is used, apply a filter using the OrderNos field.
    filter: Contains(OrderNos, '1234567890')
    
    ${generateModuleText('invoice', [
    'InvoiceDate',
    'DueDate'
  ])} `,
  z.object({
    filter: z.string().optional().describe('Filter expression for selecting specific invoices.'),
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
    return executeODataQuery("InvoiceList", {
      filter,
      top,
      skip,
      orderby,
      count,
      apply
    }, enhancedOptions);
  }
)