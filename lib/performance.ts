// Performance optimization utilities for chat responses

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  });
}

// Debounce function for API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Batch multiple async operations
export async function batchAsync<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(op => op()));
    results.push(...batchResults);
  }
  
  return results;
}

// Performance monitoring
export class PerformanceMonitor {
  private static timers = new Map<string, number>();
  
  static start(label: string): void {
    this.timers.set(label, performance.now());
  }
  
  static end(label: string): number {
    const start = this.timers.get(label);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.timers.delete(label);
    
    if (process.env.NODE_ENV === 'development') {

    }
    
    return duration;
  }
}

// Optimize tool selection based on message content
export function selectOptimalTools(messageContent: string): string[] {
  const content = messageContent.toLowerCase().trim();
  const selectedTools: string[] = [];
  
  // Log the message content for debugging

  
  // CRITICAL: Container tracking must be handled first and exclusively
  const containerPatterns = [
    'track your container',
    'container tracking', 
    'track container',
    'container status',
    'container number',
    'container details',
    'container?',
    'containers'
  ];
  
  // More aggressive container detection - ANY mention of container should use getContainers
  const isContainerRequest = content.includes('container');
  
  if (isContainerRequest) {
    selectedTools.push('getContainers');

    return selectedTools; // Early return to prevent mixing tools
  }
  
  // CRITICAL: Shipment tracking patterns
  const shipmentPatterns = [
    'track your shipment',
    'shipment tracking',
    'track shipment', 
    'shipment status',
    'shipment number',
    'shipment details'
  ];
  
  const isShipmentRequest = !content.includes('container') && 
                           (shipmentPatterns.some(pattern => content.includes(pattern)) || 
                            content.includes('shipment'));
  
  if (isShipmentRequest) {
    selectedTools.push('getShipments', 'getShipmentSequence');

    return selectedTools; // Early return to prevent mixing tools
  }
  
  // CRITICAL: Order tracking patterns
  const orderPatterns = [
    'track your order',
    'order tracking',
    'track order',
    'order status', 
    'order number',
    'order details',
    'purchase order'
  ];
  
  const isOrderRequest = orderPatterns.some(pattern => content.includes(pattern)) || 
                        (content.includes('order') && !content.includes('shipment') && !content.includes('container'));
  
  if (isOrderRequest) {
    selectedTools.push('getOrders');

    return selectedTools; // Early return to prevent mixing tools
  }
  
  // CRITICAL: Booking tracking patterns
  const bookingPatterns = [
    'track your booking',
    'booking tracking',
    'track booking',
    'booking status',
    'booking number',
    'booking details'
  ];
  
  const isBookingRequest = bookingPatterns.some(pattern => content.includes(pattern)) || 
                          (content.includes('booking') && !content.includes('shipment') && !content.includes('container'));
  
  if (isBookingRequest) {
    selectedTools.push('getBookings', 'getBookingSequence', 'getYetToBeApprovedBooking');

    return selectedTools; // Early return to prevent mixing tools
  }
  
  // General content-based tool selection (only if no specific tracking request)
  if (content.includes('invoice')) {
    selectedTools.push('getInvoices');
  }
  
  if (content.includes('document')) {
    selectedTools.push('getDocuments');
  }
  
  if (content.includes('task')) {
    selectedTools.push('getTasks');
  }
  
  if (content.includes('comment')) {
    selectedTools.push('getComments');
  }
  
  if (content.includes('exception') || content.includes('error')) {
    selectedTools.push('getExceptions');
  }
  
  if (content.includes('route') || content.includes('job') || content.includes('jobrout')) {
    selectedTools.push('getJobrouts');
  }
  
  if (content.includes('brokerage') || content.includes('broker')) {
    selectedTools.push('getBrokerages');
  }
  
  // If no specific tools are detected, return a minimal set
  if (selectedTools.length === 0) {

    return ['getShipments', 'getBookings']; // Most commonly used tools
  }
  

  return selectedTools;
}