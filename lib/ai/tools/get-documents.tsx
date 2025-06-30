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

export const getDocuments = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
    'getDocuments',
    `Get documents using a filter

    IMPORTANT: Strictly use the user request inputs like DocType, Consigenee, consigner etc.

    How many document are attached to the booking?
    filter: EntityRefCode eq 'SHP00185131'

    How many document are attached to the shipment?
    filter: EntityRefCode eq 'SHP00185131'

    How many document are attached to the orderno?
    filter: OrderNos eq '1234567890'

    If you are asked to fetch the document based on the HBL No, use the following:
    filter: HBL eq 'HBL00185131'

    If you are asked to fetch the document based on the MBL No, use the following:
    filter: MBL eq 'MBL00185131'

    If you are asked to fetch the document based on the Invoice No, use the following:
    filter: InvoiceNo eq 'INV00185131' or ExportInvoiceNo eq 'INV00185131'

    If you are asked to fetch the document based on the OwnerRefNo, use the following:
    filter: OwnerRefNo eq '1234567890'

    if you are asked to fetch the document based on the consignee or consigner, use the following:
    filter: ConsigneeCode eq 'DEMSUPKUL' or ConsignorCode eq 'DEMBUYMEL'

    If you are asked to fetch based on the document type, use the following:
    filter: DocType eq 'BOL'
    Note: The format for the document type mention in the user input.
    `,
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

        return executeODataQuery("JobDocumentsList", {
            filter,
            top,
            skip,
            orderby,
            count,
            apply
        }, enhancedOptions);
    }
);