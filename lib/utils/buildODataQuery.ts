import { translateFilterFields } from './fieldMappings';

/**
 * Constructs an OData query string based on the provided parameters.
 * @param {string} baseEndpoint - The base endpoint for the OData query (e.g., "ShipmentList").
 * @param {object} params - The query parameters.
 * @param {string} [params.filter] - The filter expression for selecting specific items.
 * @param {number} [params.top] - The maximum number of items to retrieve.
 * @param {number} [params.skip] - The number of items to skip before starting to collect the result set.
 * @param {string} [params.orderby] - The property to sort the results by.
 * @param {boolean} [params.count] - Whether to include the total count of items in the response.
 * @param {string} [params.apply] - An expression used to apply transformations to the result set.
 * @returns {string} - The constructed OData query string.
 */
export const buildODataQuery = (
    baseEndpoint: string,
    { filter, top, skip, orderby, count, apply }: { filter?: string; top?: number; skip?: number; orderby?: string; count?: boolean; apply?: string }
  ): string => {
    let query = baseEndpoint;
    const queryParams: string[] = [];
    
    // Validate and sanitize filter parameter
    if (filter) {
      try {
        // Handle special cases for certain fields
        // This is where we can add specific handling for known field mappings
        
        // Make sure the filter is properly formatted
        const sanitizedFilter = filter.trim();
        queryParams.push(`$filter=${encodeURIComponent(sanitizedFilter)}`);
        
        // Log the filter for debugging

      } catch (error) {
        console.error("Error processing filter parameter:", error);
        // If there's an error with the filter, we'll still add it but log the error
        queryParams.push(`$filter=${encodeURIComponent(filter)}`);
      }
    }
    
    if (top !== undefined) {
      queryParams.push(`$top=${top}`);
    }
    if (skip !== undefined) {
      queryParams.push(`$skip=${skip}`);
    }
    if (orderby) {
      queryParams.push(`$orderby=${encodeURIComponent(orderby)}`);
    }
    if (apply) {
      queryParams.push(`$apply=${encodeURIComponent(apply)}`);
    }
    // Always include count in the query
    queryParams.push("$count=true");
    
    if (queryParams.length > 0) {
      query += "?" + queryParams.join("&");
    }
    

    return query;
  };