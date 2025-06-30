import { executeODataQuery } from '@/lib/utils/odataHelpers';
import { createTool, CustomToolExecutionOptions } from '@/lib/utils/toolWrapper';
import { DataStreamWriter } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import { translateFilterFields } from '@/lib/utils/fieldMappings';

interface CreateGetShipmentsProps {
    session: Session;
    dataStream: DataStreamWriter;
    authToken: string;
}

export const getComments = ({ session, dataStream, authToken }: CreateGetShipmentsProps) => createTool(
    'getComments',
    `Get comments using a filter

    IMPORTANT: Strictly use the user request inputs like DocType, Consigenee, consigner etc.

    How many comment are attached to the booking?
    filter: EntityRefCode eq 'SHP00185131' or ShipmentNo eq 'SHP00185131'

    How many comment are attached to the shipment?
    filter: EntityRefCode eq 'SHP00185131' or ShipmentNo eq 'SHP00185131'

    How many comment are attached to the orderno?
    filter: OrderNos eq '1234567890' or OrderNo eq '1234567890'

    If you are asked to fetch the comment based on the HBL No, use the following:
    filter: HBL eq 'HBL00185131' or HBLNo eq 'HBL00185131'

    If you are asked to fetch the comment based on the MBL No, use the following:
    filter: MBL eq 'MBL00185131' or MBLNo eq 'MBL00185131'

    If you are asked to fetch the comment based on the Invoice No, use the following:
    filter: InvoiceNo eq 'INV00185131' or ExportInvoiceNo eq 'INV00185131'

    If you are asked to fetch the comment based on the OwnerRefNo, use the following:
    filter: OwnerRefNo eq '1234567890'

    if you are asked to fetch the comment based on the consignee or consigner, use the following:
    filter: ConsigneeCode eq 'DEMSUPKUL' or ConsignorCode eq 'DEMBUYMEL'

    If you are asked to fetch based on the comment type, use the following:
    filter: DocType eq 'BOL'
    Note: The format for the comment type mention in the user input.
    `,
    z.object({
        filter: z.string().optional().describe('Filter expression for selecting specific comments.'),
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
        return executeODataQuery("CommentsList", {
            filter,
            top,
            skip,
            orderby,
            count,
            apply
        }, enhancedOptions);
    }
);

/**
 * Add a new comment
 * Note: This is a placeholder for future implementation
 */
export const addComment = createTool(
    'addComment',
    'Add a new comment to an entity',
    z.object({
        entityRefCode: z.string().describe('The reference code of the entity to add the comment to'),
        commentText: z.string().describe('The text of the comment'),
        commentType: z.string().optional().describe('The type of comment')
    }),
    async ({ entityRefCode, commentText, commentType = 'General' }, options: CustomToolExecutionOptions) => {
        // This is a placeholder for future implementation
        // In a real implementation, this would make a POST request to create a new comment

        throw new Error('Adding comments is not yet implemented');

        // When implemented, it would return something like:
        // return {
        //   success: true,
        //   commentId: 'new-comment-id',
        //   message: 'Comment added successfully'
        // };
    }
);