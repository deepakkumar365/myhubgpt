# Error Handling for API Tools

This document provides guidelines for implementing consistent error handling across all API tool files in the project.

## Overview

We've implemented a standardized approach to error handling that:

1. Provides consistent error responses across all tools
2. Logs errors with detailed context
3. Makes debugging easier
4. Improves user experience by providing meaningful error messages

## Key Components

### 1. Error Handler Utility (`lib/utils/errorHandler.ts`)

This utility provides:
- Standardized error response format
- Error logging to date-based log files
- Helper functions for wrapping API calls with error handling

### 2. Tool Wrapper (`lib/utils/toolWrapper.ts`)

A wrapper for the AI SDK's `tool` function that:
- Automatically applies error handling
- Ensures consistent response format
- Logs tool execution details

### 3. OData Helpers (`lib/utils/odataHelpers.ts`)

Utilities for working with OData queries that:
- Handle field name translations
- Apply consistent query building
- Validate response formats

### 4. Field Mappings (`lib/utils/fieldMappings.ts`)

Maps user-friendly field names to actual API field names for different entity types.

## How to Update Tool Files

Follow these steps to update existing tool files to use the new error handling approach:

1. **Update imports**:
   ```typescript
   import { createTool, CustomToolExecutionOptions } from '../utils/toolWrapper';
   import { executeODataQuery } from '../utils/odataHelpers';
   ```

2. **Replace `tool()` with `createTool()`**:
   ```typescript
   // Before
   export const myTool = tool({
     description: 'Tool description',
     parameters: z.object({ ... }),
     execute: async (params, options) => { ... }
   });

   // After
   export const myTool = createTool(
     'myTool',
     'Tool description',
     z.object({ ... }),
     async (params, options) => { ... }
   );
   ```

3. **Use `executeODataQuery` for standard OData operations**:
   ```typescript
   async (params, options) => {
     return executeODataQuery("EntityName", params, options);
   }
   ```

4. **For custom logic, throw errors directly**:
   ```typescript
   if (!condition) {
     throw new Error('Meaningful error message');
   }
   ```

5. **Return consistent response format**:
   ```typescript
   return { 
     value: result, 
     count: result.length 
   };
   ```

## Example Implementation

```typescript
import * as z from 'zod';
import { createTool, CustomToolExecutionOptions } from '../utils/toolWrapper';
import { executeODataQuery } from '../utils/odataHelpers';

export const getEntityList = createTool(
  'getEntityList',
  'Get entities using a filter',
  z.object({
    filter: z.string().optional().describe('Filter expression'),
    top: z.number().optional().default(10).describe('Max items'),
    skip: z.number().optional().default(0).describe('Items to skip'),
    count: z.boolean().optional().default(true).describe('Include count'),
  }),
  async (params, options) => {
    return executeODataQuery("EntityName", params, options);
  }
);
```

## Testing Error Handling

To test the error handling, you can:

1. Provide an invalid filter expression
2. Use a non-existent entity name
3. Simulate network errors
4. Pass invalid parameters

The system should respond with meaningful error messages in all cases.

## Adding New Entity Types

When adding support for a new entity type:

1. Add field mappings in `fieldMappings.ts`
2. Create tool files using the `createTool` wrapper
3. Use `executeODataQuery` for standard operations