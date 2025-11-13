/**
 * Extractor functions for NDC Order data
 */
import { OrderSummary, OrderDetails, TicketInfo } from "./../types";
/**
 * Extract order details
 */
export declare function extractOrderDetails(data: any): OrderDetails;
/**
 * Extract all tickets
 */
export declare function extractTickets(data: any): TicketInfo[];
/**
 * Main function to extract complete order summary
 */
export declare function extractOrderSummary(orderData: any): OrderSummary;
