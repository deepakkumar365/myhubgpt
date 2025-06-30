/**
 * This script provides a template for updating all tool files to use the new error handling approach.
 * It's meant to be used as a reference for manual updates, not to be run automatically.
 */

const toolFileTemplate = `import * as z from 'zod';
import { fetchOData } from '../utils/fetchData';
import { buildODataQuery } from '../utils/buildODataQuery';
import { createTool, CustomToolExecutionOptions } from '../utils/toolWrapper';
import { translateFilterFields } from '../utils/fieldMappings';

/**
 * Tool description
 */
export const toolName = createTool(
    'toolName',
    'Tool description',
    z.object({
        // Parameters
        param1: z.string().describe('Parameter description'),
        param2: z.number().optional().default(10).describe('Parameter description'),
    }),
    async ({ param1, param2 }, options: CustomToolExecutionOptions) => {
        // Implementation
        const query = buildODataQuery("EntityName", { 
            filter: \`field eq '\${param1}'\`, 
            top: param2
        });
        
        const res = await fetchOData(query, options.context?.authHeader);
        
        // Check if the response has the expected structure
        if (!res || !Array.isArray(res.value)) {
            throw new Error('Received invalid response format from the server');
        }
        
        return { 
            value: res.value, 
            count: res['@odata.count'] || res.value.length 
        };
    }
);`;

// Steps to update a tool file:

// 1. Import the necessary utilities:
//    - import { createTool, CustomToolExecutionOptions } from '../utils/toolWrapper';
//    - import { translateFilterFields } from '../utils/fieldMappings';

// 2. Replace tool() with createTool():
//    - Change: export const toolName = tool({ ... })
//    - To: export const toolName = createTool('toolName', 'description', parameters, async (params, options) => { ... })

// 3. Remove try/catch blocks in the execute function:
//    - The createTool wrapper will handle errors automatically

// 4. Make sure to check response validity:
//    - if (!res || !Array.isArray(res.value)) {
//        throw new Error('Received invalid response format from the server');
//      }

// 5. Return a consistent response format:
//    - return { 
//        value: res.value, 
//        count: res['@odata.count'] || res.value.length 
//      };

// See the template above for a complete example.