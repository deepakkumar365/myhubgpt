/**
 * Tool Validation Utility
 * Prevents wrong tool usage by analyzing message content
 */

export interface ToolValidationResult {
  isValid: boolean;
  correctTool?: string;
  errorMessage?: string;
}

export function validateToolUsage(messageContent: string, requestedTool: string): ToolValidationResult {
  const content = messageContent.toLowerCase();
  
  // Container validation
  if (content.includes('container')) {
    if (requestedTool === 'getShipments') {
      return {
        isValid: false,
        correctTool: 'getContainers',
        errorMessage: 'Container queries must use getContainers, not getShipments'
      };
    }
    if (requestedTool === 'getOrders') {
      return {
        isValid: false,
        correctTool: 'getContainers', 
        errorMessage: 'Container queries must use getContainers, not getOrders'
      };
    }
    if (requestedTool === 'getBookings') {
      return {
        isValid: false,
        correctTool: 'getContainers',
        errorMessage: 'Container queries must use getContainers, not getBookings'
      };
    }
  }
  
  // Shipment validation  
  if (content.includes('shipment') && !content.includes('container')) {
    if (requestedTool === 'getContainers') {
      return {
        isValid: false,
        correctTool: 'getShipments',
        errorMessage: 'Shipment queries must use getShipments, not getContainers'
      };
    }
  }
  
  // Order validation
  if (content.includes('order') && !content.includes('container') && !content.includes('shipment')) {
    if (requestedTool === 'getShipments') {
      return {
        isValid: false,
        correctTool: 'getOrders',
        errorMessage: 'Order queries must use getOrders, not getShipments'
      };
    }
    if (requestedTool === 'getContainers') {
      return {
        isValid: false,
        correctTool: 'getOrders',
        errorMessage: 'Order queries must use getOrders, not getContainers'
      };
    }
  }
  
  return { isValid: true };
}

export function getCorrectToolForMessage(messageContent: string): string[] {
  const content = messageContent.toLowerCase();
  
  if (content.includes('container')) {
    return ['getContainers'];
  }
  
  if (content.includes('shipment') && !content.includes('container')) {
    // Check for comprehensive/complete/full shipment details requests
    if (content.includes('complete shipment details') || 
        content.includes('comprehensive shipment') ||
        content.includes('full shipment details') ||
        content.includes('show complete shipment') ||
        content.includes('complete shipment') ||
        content.includes('shipment details') ||
        content.includes('shipment sequence') ||
        content.includes('all shipment information') ||
        content.includes('timeline') || 
        content.includes('history')) {
      return ['getShipmentSequence'];
    }
    return ['getShipments'];
  }
  
  if (content.includes('order') && !content.includes('container') && !content.includes('shipment')) {
    return ['getOrders'];
  }
  
  if (content.includes('booking') && !content.includes('container') && !content.includes('shipment')) {
    if (content.includes('yet to be approved') || content.includes('pending approval') || content.includes('booking approval')) {
      return ['getYetToBeApprovedBooking'];
    }
    if (content.includes('show complete booking details') || content.includes('booking sequence') || content.includes('sequence') || content.includes('timeline') || content.includes('history')) {
      return ['getBookingSequence'];
    }
    return ['getBookings'];
  }
  
  if (content.includes('document')) {
    return ['getDocuments'];
  }
  
  if (content.includes('invoice')) {
    return ['getInvoices'];
  }
  
  if (content.includes('task')) {
    return ['getTasks'];
  }
  
  if (content.includes('comment')) {
    return ['getComments'];
  }
  
  if (content.includes('exception')) {
    return ['getExceptions'];
  }
  
  if (content.includes('jobrout') || content.includes('route')) {
    return ['getJobrouts'];
  }
  
  if (content.includes('brokerage')) {
    return ['getBrokerages'];
  }
  
  // Default fallback - ALL TOOLS AVAILABLE
  return [
    'getContainers', 
    'getShipments',
    'getShipmentSequence',
    'getBookings',
    'getBookingSequence',
    'getYetToBeApprovedBooking',
    'getOrders',
    'getDocuments',
    'getInvoices', 
    'getTasks',
    'getComments',
    'getExceptions',
    'getJobrouts',
    'getBrokerages'
  ];
}