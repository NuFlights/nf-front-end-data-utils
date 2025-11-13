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
  taxCode: string | null;
  amount: number | null;
  currency: string | null;
  taxName: string | null;
  taxType: string | null;
  ref: string;
}

export interface LoyaltyProgram {
  accountNumber: string | null;
  programCode: string | null;
  programName: string | null;
  carrier: string | null;
  ref: string;
}

export interface BaggageAllowance {
  pieceQty: number | null;
  weightValue: number | null;
  weightUnit: string | null;
  ref: string;
}

export interface SegmentInfo {
  segmentRefId: string | null;
  origin: string | null;
  destination: string | null;
  rbd: string | null;
  departureDatetime: string | null;
  couponStatus: string | null;
  fareBasisCode: string | null;
  baggageAllowance: BaggageAllowance | null;
  couponNumber: string | null;
  cabinTypeCode?: string | null;
  ref: string;
}

export interface PassengerInfo {
  paxRefId: string | null;
  givenName: string | null;
  surname: string | null;
  middleName: string | null;
  title: string | null;
  ptc: string | null;
  loyaltyPrograms: LoyaltyProgram[];
  ref: string;
}

export interface TicketInfo {
  ticketNumber: string | null;
  issueDate: string | null;
  issueTime: string | null;
  passenger: PassengerInfo | null;
  baseFare: MonetaryAmount;
  totalTax: MonetaryAmount;
  taxBreakdown: TaxBreakdown[];
  totalAmount: MonetaryAmount;
  ticketType: string | null;
  segments: SegmentInfo[];
  reportingTypeCode: string | null;
  ref: string;
}

export interface IssuingOffice {
  orgId: string | null;
  orgName: string | null;
  orgRole: string | null;
  salesAgentId: string | null;
  salesBranchId: string | null;
  ref: string;
}

export interface OrderDetails {
  bookingReference: string | null;
  issuingOffice: IssuingOffice;
  pcc: string | null;
  ref: string;
}

export interface OrderSummary {
  orderDetails: OrderDetails;
  tickets: TicketInfo[];
}

export interface ExtractionError {
  path: string;
  error: string;
}
