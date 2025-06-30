/**
 * Field mappings for different entity types in the OData API
 * This helps translate between user-friendly field names and actual API field names
 */

// Map of entity types to their field mappings
export const fieldMappings: Record<string, Record<string, string>> = {
  // JobExceptionList field mappings
  JobExceptionList: {
    // Map user-friendly field names to actual API field names
    ShipmentNo: 'EntityRefCode',
    BookingNo: 'EntityRefCode',
    JobNo: 'JobNo',
    Status: 'Status',
    CreatedBy: 'CreatedBy',
    CreatedDate: 'CreatedDateTime',
  },

  // JobDocumentsList field mappings
  JobDocumentsList: {
    ShipmentNo: 'EntityRefCode',
    BookingNo: 'EntityRefCode',
    DocumentNo: 'DocumentNo',
    DocType: 'DocType',
    FileName: 'FileName',
    CreatedBy: 'CreatedBy',
    CreatedDate: 'CreatedDateTime',
  },

  // Add mappings for other entity types as needed
  ShipmentList: {
    ShipmentNo: 'ShipmentNo',
    BookingNo: 'BookingNo',
    Status: 'Status',
    CreatedBy: 'CreatedBy',
    CreatedDate: 'CreatedDateTime',
  },

  OrderList: {
    OrderNo: 'OrderNo',
    Status: 'Status',
    CreatedBy: 'CreatedBy',
    CreatedDate: 'CreatedDateTime',
  },

  CommentsList: {
    ShipmentNo: 'EntityRefCode',
    BookingNo: 'EntityRefCode',
    OrderNo: 'OrderNos',
    HBLNo: 'HBL',
    MBLNo: 'MBL',
    InvoiceNo: 'InvoiceNo',
    ExportInvoiceNo: 'ExportInvoiceNo',
    OwnerRefNo: 'OwnerRefNo',
    ConsigneeCode: 'ConsigneeCode',
    ConsignorCode: 'ConsignorCode',
    DocType: 'DocType',
    CreatedBy: 'CreatedBy',
    CreatedDate: 'CreatedDateTime',
  },

  TaskList: {
    entityRefKey: 'KeyReference',
    ShipmentNo: 'ShipmentNo',
    BookingNo: 'BookingNo',
    Status: 'Status',
    CreatedBy: 'CreatedBy',
    CreatedDate: 'CreatedDateTime',
  },

  ContainerList: {
    ContainerNo: 'ContainerNo',
    ShipmentNo: 'ShipmentNo',
    BookingNo: 'BookingNo',
    Status: 'Status',
    ATD: 'ATD',
    ATA: 'ATA',
    ETA: 'ETA',
    ActualDelivery: 'ActualDelivery',
    RequestedDelivery: 'RequestedDelivery',
    CreatedBy: 'CreatedBy',
    CreatedDate: 'CreatedDateTime',
  },
};

/**
 * Translates a filter expression using the appropriate field mappings
 * @param entityType The type of entity being queried (e.g., "JobExceptionList")
 * @param filter The original filter expression
 * @returns The translated filter expression
 */
export function translateFilterFields(entityType: string, filter?: string): string | undefined {
  if (!filter) return filter;

  const mappings = fieldMappings[entityType];
  if (!mappings) return filter;

  let translatedFilter = filter;

  // Replace each field name with its mapped equivalent
  Object.entries(mappings).forEach(([userField, apiField]) => {
    // Create a regex that matches the field name followed by a comparison operator
    const fieldRegex = new RegExp(`\\b${userField}\\s+(eq|ne|gt|lt|ge|le)\\b`, 'gi');
    translatedFilter = translatedFilter.replace(fieldRegex, `${apiField} $1`);
  });

  return translatedFilter;
}