/**
 * nf-ndc-order-utils
 *
 * Utility module for extracting attributes from IATA NDC Order View JSON documents
 * and returning a simplified JSON structure with source references.
 */
export { extractOrderSummary, extractOrderDetails, extractTickets, } from "./extractors";
export { OrderSummary, OrderDetails, IssuingOffice, TicketInfo, PassengerInfo, LoyaltyProgram, MonetaryAmount, TaxBreakdown, SegmentInfo, BaggageAllowance, DataReference, ExtractionError, } from "./types";
