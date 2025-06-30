import { fetchOData } from './fetchData';
import { buildODataQuery } from './buildODataQuery';
import { translateFilterFields } from './fieldMappings';
import { CustomToolExecutionOptions } from './toolWrapper';

/**
 * Standard parameters for OData queries
 */
export interface ODataQueryParams {
  filter?: string;
  top?: number;
  skip?: number;
  orderby?: string;
  count?: boolean;
  apply?: string;
}

/**
 * Executes an OData query with standardized error handling and response formatting
 * 
 * @param entityName The name of the entity to query
 * @param params The query parameters
 * @param options Tool execution options containing auth header
 * @returns The query results with count information
 */
export async function executeODataQuery(
  entityName: string,
  params: ODataQueryParams,
  options: CustomToolExecutionOptions
) {
  const { filter, top = 10, skip = 0, count = true, orderby, apply } = params;
  

  
  // Translate user-friendly field names to actual API field names
  const translatedFilter = translateFilterFields(entityName, filter);

  
  // Build the OData query
  const query = buildODataQuery(entityName, { 
    filter: translatedFilter, 
    top, 
    skip, 
    orderby, 
    count, 
    apply 
  });
  
  // Execute the query
  const res = await fetchOData(query, options.context?.authHeader);
  
  // Check if the response has the expected structure
  if (!res || !Array.isArray(res.value)) {
    throw new Error(`Received invalid response format from the server for ${entityName}`);
  }
  
  // Return the results with count information
  return res;
}