/**
 * Types for the NDC Order Utils module
 */

export interface DataReference {
  value: any;
  ref: string;
}

export interface MonetaryAmount {
  amount: number | null;
  currency: string | null;
  ref: string;
}

export interface TaxBreakdown {
  tax_code: string | null;
  amount: number | null;
  currency: string | null;
  tax_name: string | null;
  tax_type: string | null;
  ref: string;
}

export interface LoyaltyProgram {
  account_number: string | null;
  program_code: string | null;
  program_name: string | null;
  carrier: string | null;
  ref: string;
}

export interface BaggageAllowance {
  piece_qty: number | null;
  weight_value: number | null;
  weight_unit: string | null;
  ref: string;
}

export interface SegmentInfo {
  segment_ref_id: string | null;
  origin: string | null;
  destination: string | null;
  rbd: string | null;
  departure_datetime: string | null;
  coupon_status: string | null;
  fare_basis_code: string | null;
  baggage_allowance: BaggageAllowance | null;
  coupon_number: string | null;
  cabin_type_code?: string | null;
  ref: string;
}

export interface PassengerInfo {
  pax_ref_id: string | null;
  given_name: string | null;
  surname: string | null;
  middle_name: string | null;
  title: string | null;
  ptc: string | null;
  loyalty_programs: LoyaltyProgram[];
  ref: string;
}

export interface TicketInfo {
  ticket_number: string | null;
  issue_date: string | null;
  issue_time: string | null;
  passenger: PassengerInfo | null;
  base_fare: MonetaryAmount;
  total_tax: MonetaryAmount;
  tax_breakdown: TaxBreakdown[];
  total_amount: MonetaryAmount;
  ticket_type: string | null;
  segments: SegmentInfo[];
  reportingTypeCode: string | null;
  ref: string;
}

export interface IssuingOffice {
  org_id: string | null;
  org_name: string | null;
  org_role: string | null;
  sales_agent_id: string | null;
  sales_branch_id: string | null;
  ref: string;
}

export interface OrderDetails {
  booking_reference: string | null;
  issuing_office: IssuingOffice;
  pcc: string | null;
  ref: string;
}

export interface OrderSummary {
  order_details: OrderDetails;
  tickets: TicketInfo[];
}

export interface ExtractionError {
  path: string;
  error: string;
}
