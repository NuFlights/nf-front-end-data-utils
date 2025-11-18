/**
 * Extractor functions for NDC Order data
 */

import * as jmespath from "jmespath";
import {
  OrderSummary,
  OrderDetails,
  IssuingOffice,
  TicketInfo,
  PassengerInfo,
  LoyaltyProgram,
  MonetaryAmount,
  TaxBreakdown,
  SegmentInfo,
  BaggageAllowance,
  seatDetails,
} from "./types";

const ERROR_NOT_FOUND = "Value not found at path";
const ERROR_EXTRACTION_FAILED = "Extraction failed";

/**
 * Safely extract value using JMESPath with error handling
 */
function safeExtract(data: any, path: string, defaultValue: any = null): any {
  try {
    const result = jmespath.search(data, path);
    return result !== null && result !== undefined ? result : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Create error reference
 */
function errorRef(path: string, error: string = ERROR_NOT_FOUND): string {
  return `ERROR: ${error} - ${path}`;
}

/**
 * Extract booking reference (PNR)
 * Uses the orderId from the response
 */
function extractBookingReference(data: any): {
  value: string | null;
  ref: string;
} {
  const path =
    "iataOrderRetrieve.response.order[0].orderItem[0].service[0].bookingRef[0].bookingId";
  const value = safeExtract(data, path);
  return {
    value,
    ref: value !== null ? path : errorRef(path),
  };
}

/**
 * Extract issuing office information
 * In the new structure, uses servicingAgency from ticketDocInfo
 */
function extractIssuingOffice(data: any): IssuingOffice {
  const basePath =
    "iataOrderRetrieve.response.ticketDocInfo[0].servicingAgency";
  const agency = safeExtract(data, basePath);

  if (agency && typeof agency === "object") {
    return {
      orgId: agency.agencyId?.toString() || null,
      orgName: null,
      orgRole: "ServicingAgency",
      salesAgentId: agency.iataNumber?.toString() || null,
      salesBranchId: null,
      ref: basePath,
    };
  }

  return {
    orgId: null,
    orgName: null,
    orgRole: null,
    salesAgentId: null,
    salesBranchId: null,
    ref: errorRef(basePath, "Servicing agency not found"),
  };
}

/**
 * Extract PCC (Pseudo City Code)
 * May not be directly available in new structure
 */
function extractPCC(data: any): { value: string | null; ref: string } {
  const path =
    "iataOrderRetrieve.response.ticketDocInfo[0].servicingAgency.agencyId";
  const value = safeExtract(data, path);
  return {
    value: value?.toString() || null,
    ref:
      value !== null ? path : errorRef(path, "PCC not found - using agencyId"),
  };
}

/**
 * Extract order details
 */
export function extractOrderDetails(data: any): OrderDetails {
  const bookingRef = extractBookingReference(data);
  const issuingOffice = extractIssuingOffice(data);
  const pcc = extractPCC(data);

  return {
    bookingReference: bookingRef.value,
    issuingOffice: issuingOffice,
    pcc: pcc.value,
    ref: "iataOrderRetrieve.response",
  };
}

/**
 * Extract passenger information by reference ID
 */
function extractPassengerInfo(
  data: any,
  paxRefId: string | string[]
): PassengerInfo | null {
  const paxListPath = "iataOrderRetrieve.response.dataLists.paxList.pax";
  const paxList = safeExtract(data, paxListPath, []);

  if (!Array.isArray(paxList)) {
    return null;
  }

  // Handle both single string and array of strings
  const refIds = Array.isArray(paxRefId) ? paxRefId : [paxRefId];

  // Find passenger matching any of the reference IDs
  let paxIndex = -1;
  let passenger = null;

  for (let i = 0; i < paxList.length; i++) {
    // Check both paxRefId and paxId
    if (
      // refIds.includes(paxList[i].paxRefId) ||
      refIds.includes(paxList[i].paxId)
    ) {
      passenger = paxList[i];
      paxIndex = i;
      break;
    }
  }

  if (!passenger || paxIndex < 0) {
    return {
      paxRefId: Array.isArray(paxRefId) ? paxRefId[0] : paxRefId,
      givenName: null,
      surname: null,
      middleName: null,
      title: null,
      ptc: null,
      loyaltyPrograms: [],
      ref: errorRef(
        paxListPath,
        `Passenger not found for ref_id: ${refIds.join(", ")}`
      ),
    };
  }

  const paxPath = `${paxListPath}[${paxIndex}]`;
  const individual = passenger.individual || {};

  // Extract given names (array) and join with space
  const givenNames = Array.isArray(individual.givenName)
    ? individual.givenName.join(" ").toUpperCase()
    : (individual.givenName || "").toUpperCase();

  // Extract middle names (array) and join with space
  const middleNames = Array.isArray(individual.middleName)
    ? individual.middleName.join(" ").toUpperCase()
    : (individual.middleName || "").toUpperCase();

  // Extract surname
  const surname = (individual.surname || "").toUpperCase();

  // Extract title
  const title = (individual.titleName || "").toUpperCase();

  // Extract PTC
  const ptc = (passenger.ptc || "").toUpperCase();

  // Extract loyalty programs
  const loyaltyPrograms: LoyaltyProgram[] = [];
  if (Array.isArray(passenger.loyaltyProgramAccount)) {
    passenger.loyaltyProgramAccount.forEach((program: any, idx: number) => {
      loyaltyPrograms.push({
        accountNumber: program.accountNumber || null,
        programCode: program.loyaltyProgram?.programCode || null,
        programName: program.loyaltyProgram?.programName || null,
        carrier: program.loyaltyProgram?.carrier?.airlineDesigCode || null,
        ref: `${paxPath}.loyaltyProgramAccount[${idx}]`,
      });
    });
  }

  return {
    paxRefId: passenger.paxRefId || passenger.paxId,
    givenName: givenNames || null,
    surname: surname || null,
    middleName: middleNames || null,
    title: title || null,
    ptc: ptc || null,
    loyaltyPrograms: loyaltyPrograms,
    ref: paxPath,
  };
}

/**
 * Extract monetary amount
 */
function extractMonetaryAmount(data: any, basePath: string): MonetaryAmount {
  const amountObj = safeExtract(data, basePath);

  if (amountObj && typeof amountObj === "object") {
    return {
      amount:
        amountObj.cdata !== undefined && amountObj.cdata !== null
          ? Number(amountObj.cdata)
          : null,
      currency: amountObj.curCode || null,
      ref: basePath,
    };
  }

  return {
    amount: null,
    currency: null,
    ref: errorRef(basePath),
  };
}

/**
 * Extract tax breakdown
 */
function extractTaxBreakdown(
  ticketDocInfo: any,
  ticketIndex: number
): TaxBreakdown[] {
  const taxes: TaxBreakdown[] = [];
  const farePriceTypes = ticketDocInfo.fareDetail?.farePriceType || [];

  farePriceTypes.forEach((priceType: any, ptIdx: number) => {
    const taxSummaries = priceType.price?.taxSummary || [];

    taxSummaries.forEach((summary: any, tsIdx: number) => {
      const taxList = summary.tax || [];

      if (Array.isArray(taxList)) {
        taxList.forEach((tax: any, taxIdx: number) => {
          const basePath = `ticketDocInfo[${ticketIndex}].fareDetail.farePriceType[${ptIdx}].price.taxSummary[${tsIdx}].tax[${taxIdx}]`;

          taxes.push({
            taxCode: tax.taxCode || null,
            amount:
              tax.amount?.cdata !== undefined && tax.amount?.cdata !== null
                ? Number(tax.amount.cdata)
                : null,
            currency: tax.amount?.curCode || null,
            taxName: tax.taxName || null,
            taxType: tax.taxTypeCode || null,
            ref: basePath,
          });
        });
      }
    });
  });

  return taxes;
}

/**
 * Extract baggage allowance by reference ID
 */
function extractBaggageAllowance(
  data: any,
  baggageRefIds: string[]
): BaggageAllowance | null {
  if (!baggageRefIds || baggageRefIds.length === 0) {
    return null;
  }

  const baggageListPath =
    "iataOrderRetrieve.response.dataLists.baggageAllowanceList.baggageAllowance";
  const baggageList = safeExtract(data, baggageListPath, []);

  if (!Array.isArray(baggageList)) {
    return {
      pieceQty: null,
      weightValue: null,
      weightUnit: null,
      ref: errorRef(baggageListPath, "Baggage allowance list not found"),
    };
  }

  // Find first matching baggage allowance
  for (let i = 0; i < baggageList.length; i++) {
    if (baggageRefIds.includes(baggageList[i].baggageAllowanceId)) {
      const baggage = baggageList[i];
      const baggagePath = `${baggageListPath}[${i}]`;

      return {
        pieceQty: baggage.pieceAllowance?.totalQty || null,
        weightValue: baggage.weightAllowance?.[0]?.maximumWeightMeasure || null,
        weightUnit:
          baggage.weightAllowance?.[0]?.weightUnitOfMeasurement || null,
        ref: baggagePath,
      };
    }
  }

  return {
    pieceQty: null,
    weightValue: null,
    weightUnit: null,
    ref: errorRef(
      baggageListPath,
      `Baggage allowance not found for ref_ids: ${baggageRefIds.join(", ")}`
    ),
  };
}

/**
 * Extract segment information from coupon
 */
function extractSegmentInfo(
  data: any,
  coupon: any,
  ticketIndex: number,
  ticketIdx: number,
  couponIdx: number,
  ticketDocInfo: any
): SegmentInfo {
  const couponPath = `ticketDocInfo[${ticketIndex}].ticket[${ticketIdx}].coupon[${couponIdx}]`;

  // Get segment reference ID
  const segmentRefIds =
    coupon.currentCouponFlightInfoRef?.currentAirlinePaxSegmentRef
      ?.paxSegmentRefId ||
    coupon.currentCouponFlightInfoRef?.flownAirlinePaxSegmentRef
      ?.paxSegmentRefId ||
    coupon.currentCouponFlightInfoRef?.checkedInAirlinePaxSegmentRef
      ?.paxSegmentRefId ||
    [];

  const refIdArray = Array.isArray(segmentRefIds)
    ? segmentRefIds
    : [segmentRefIds];
  const segmentRefId = refIdArray[0] || null;

  const paxRefIds =
    ticketDocInfo?.paxRefId && Array.isArray(ticketDocInfo?.paxRefId)
      ? ticketDocInfo?.paxRefId
      : [ticketDocInfo?.paxRefId];

  if (!segmentRefId) {
    return {
      segmentRefId: null,
      origin: null,
      destination: null,
      rbd: null,
      departureDatetime: null,
      couponStatus: coupon.couponStatusCode || null,
      fareBasisCode: coupon.fareBasisCode || null,
      baggageAllowance: null,
      couponNumber: coupon.couponNumber || null,
      cabinTypeCode: null,
      seatOnLeg: null,
      ref: errorRef(couponPath, "Segment reference not found"),
    };
  }

  // Find segment in pax_segment list
  const paxSegmentListPath =
    "iataOrderRetrieve.response.dataLists.paxSegmentList.paxSegment";
  const paxSegmentList = safeExtract(data, paxSegmentListPath, []);

  let paxSegment = null;
  let paxSegmentIndex = -1;

  if (Array.isArray(paxSegmentList)) {
    for (let i = 0; i < paxSegmentList.length; i++) {
      if (paxSegmentList[i].paxSegmentId === segmentRefId) {
        paxSegment = paxSegmentList[i];
        paxSegmentIndex = i;
        break;
      }
    }
  }

  if (!paxSegment || paxSegmentIndex < 0) {
    return {
      segmentRefId: segmentRefId,
      origin: null,
      destination: null,
      rbd: paxSegment?.marketingCarrierRbdCode || null,
      departureDatetime: null,
      couponStatus: coupon.couponStatusCode || null,
      fareBasisCode: coupon.fareBasisCode || null,
      baggageAllowance: extractBaggageAllowance(
        data,
        coupon.baggageAllowanceRefId || []
      ),
      couponNumber: coupon.couponNumber || null,
      cabinTypeCode: null,
      seatOnLeg: null,
      ref: errorRef(
        paxSegmentListPath,
        `Segment not found for ref_id: ${segmentRefId}`
      ),
    };
  }

  // Get marketing segment reference
  const marketingSegmentRefId = paxSegment.datedMarketingSegmentRefId;
  let rbd = paxSegment.marketingCarrierRbdCode || null;
  let fareBasisCode = coupon.fareBasisCode || null;
  let cabinTypeCode = null;
  let seatOnLeg = null;

  const orderItemPath = "iataOrderRetrieve.response.order[0].orderItem";
  const orderItems = safeExtract(data, orderItemPath, []);
  if (rbd === null || fareBasisCode === null) {
    if (Array.isArray(orderItems)) {
      for (const orderItem of orderItems) {
        const orderItemFareDetailPath = orderItem.fareDetail;
        const orderItemServicePath = orderItem.service;
        for (const fareDetail of orderItemFareDetailPath) {
          const orderItemFareDetailFareComponentPath = fareDetail.fareComponent;
          for (const fareComponent of orderItemFareDetailFareComponentPath) {
            const paxSegmentRefId = Array.isArray(
              fareComponent?.paxSegmentRefId
            )
              ? fareComponent?.paxSegmentRefId
              : [fareComponent?.paxSegmentRefId];
            if (paxSegmentRefId.includes(segmentRefId)) {
              if (rbd === null) {
                rbd = fareComponent.rbd.rbdCode;
              }
              if (fareBasisCode === null) {
                fareBasisCode = fareComponent.fareBasisCode;
              }
              cabinTypeCode = fareComponent.cabinType.cabinTypeCode;
              break;
            }
          }
        }
      }
    }
  }

  if (seatOnLeg === null) {
    if (Array.isArray(orderItems)) {
      for (const orderItem of orderItems) {
        const orderItemServicePath = orderItem.service;
        for (const service of orderItemServicePath) {
          let paxSegmentRefId =
            service?.orderServiceAssociation?.paxSegmentRef?.paxSegmentRefId;
          paxSegmentRefId = Array.isArray(paxSegmentRefId)
            ? paxSegmentRefId
            : [paxSegmentRefId];

          if (
            paxSegmentRefId.includes(segmentRefId) &&
            paxRefIds.includes(service?.paxRefId) &&
            service.orderServiceAssociation &&
            service.orderServiceAssociation.seatOnLeg &&
            service.orderServiceAssociation.seatOnLeg.seat &&
            service.orderServiceAssociation.seatOnLeg.seat.columnId
          ) {
            if (seatOnLeg === null) {
              seatOnLeg = service.orderServiceAssociation.seatOnLeg.seat;
              console.log("seatOnLeg", seatOnLeg);
            }
            break;
          }
        }
      }
    }
  }

  // Find marketing segment
  const marketingSegmentListPath =
    "iataOrderRetrieve.response.dataLists.datedMarketingSegmentList.datedMarketingSegment";
  const marketingSegmentList = safeExtract(data, marketingSegmentListPath, []);

  let marketingSegment = null;

  if (Array.isArray(marketingSegmentList)) {
    for (const segment of marketingSegmentList) {
      if (segment.datedMarketingSegmentId === marketingSegmentRefId) {
        marketingSegment = segment;
        break;
      }
    }
  }

  const origin = marketingSegment?.dep?.iataLocationCode || null;
  const destination = marketingSegment?.arrival?.iataLocationCode || null;
  const departureDateTime =
    marketingSegment?.dep?.aircraftScheduledDateTime || null;

  return {
    segmentRefId: segmentRefId,
    origin,
    destination,
    rbd,
    departureDatetime: departureDateTime,
    couponStatus: coupon.couponStatusCode || null,
    fareBasisCode: fareBasisCode,
    baggageAllowance: extractBaggageAllowance(
      data,
      coupon.baggageAllowanceRefId || []
    ),
    couponNumber: coupon.couponNumber || null,
    cabinTypeCode: cabinTypeCode || null,
    ref: `${paxSegmentListPath}[${paxSegmentIndex}]`,
    seatOnLeg,
  };
}

/**
 * Extract all tickets
 */
export function extractTickets(data: any): TicketInfo[] {
  const tickets: TicketInfo[] = [];
  const seatDetails: seatDetails[] = [];
  const ticketDocInfoPath = "iataOrderRetrieve.response.ticketDocInfo";
  let ticketDocInfoList = safeExtract(data, ticketDocInfoPath, []);

  const orderPath = "iataOrderRetrieve.response.order";
  let orderList = safeExtract(data, orderPath, []);

  if (Array.isArray(orderList)) {
    orderList.forEach((order: any, orderIndex: number) => {
      order?.orderItem?.forEach(
        (orderItemRecord: any, orderItemRecordIndex: number) => {
          if (
            orderItemRecord?.fareDetail &&
            orderItemRecord?.fareDetail?.length === 0 &&
            orderItemRecord?.service &&
            orderItemRecord?.service?.length > 0
          ) {
            orderItemRecord?.service?.forEach(
              (orderService: any, orderServiceIndex: number) => {
                if (
                  orderService?.orderServiceAssociation?.seatOnLeg?.seat
                    ?.columnId
                ) {
                  const obj: seatDetails = {
                    orderServiceAssociation:
                      orderService?.orderServiceAssociation,
                    paxRefId: orderService?.paxRefId,
                    price: orderItemRecord?.price,
                    ref: `${orderPath}[${orderIndex}].orderItem[${orderItemRecordIndex}].service[${orderServiceIndex}]`,
                  };
                  seatDetails.push(obj);
                }
              }
            );
          }
        }
      );
    });
  }

  console.log("seatDetailsssssssssssssssssssssssssssssssss", seatDetails);

  if (!Array.isArray(ticketDocInfoList)) {
    return tickets;
  } else {
    ticketDocInfoList = ticketDocInfoList.filter(
      (list: any) =>
        list?.ticket?.[0]?.ticketDocTypeCode === "702" ||
        list?.ticket?.[0]?.ticketDocTypeCode === "INF" ||
        list?.ticket?.[0]?.ticketDocTypeCode === "T"
    );
  }

  ticketDocInfoList.forEach((ticketDocInfo: any, ticketIndex: number) => {
    const ticketDocPath = `${ticketDocInfoPath}[${ticketIndex}]`;

    // Find ticket with status 'T' (valid ticket) or use first ticket
    const ticketList = ticketDocInfo.ticket || [];
    let validTicket = null;
    let validTicketIndex = -1;

    for (let i = 0; i < ticketList.length; i++) {
      if (ticketList[i].coupon[0].couponStatusCode === "T") {
        validTicket = ticketList[i];
        validTicketIndex = i;
        break;
      }
    }

    // If no ticket with status 'T', use first ticket
    if (!validTicket && ticketList.length > 0) {
      validTicket = ticketList[0];
      validTicketIndex = 0;
    }
    let reportingTypeCode = null;
    if (validTicket) {
      reportingTypeCode = validTicket.reportingTypeCode;
    }

    // Get ticket number from originalIssueInfo or ticket
    const ticketNumber =
      ticketDocInfo.originalIssueInfo?.ticketNumber ||
      validTicket?.ticketNumber ||
      null;

    const issueDate = ticketDocInfo.originalIssueInfo?.issueDate || null;
    const issueTime = ticketDocInfo.originalIssueInfo?.issueTime || null;

    // Extract passenger info
    const paxRefId = ticketDocInfo.paxRefId;
    console.log("paxRefIddddddddddddddddddddddddddddddddddd", paxRefId);
    const passenger = paxRefId ? extractPassengerInfo(data, paxRefId) : null;

    // Extract fare information
    const baseFare = extractMonetaryAmount(
      ticketDocInfo,
      "fareDetail.farePriceType[0].price.baseAmount"
    );

    const totalTax = extractMonetaryAmount(
      ticketDocInfo,
      "fareDetail.farePriceType[0].price.taxSummary[0].totalTaxAmount"
    );

    const totalAmount = extractMonetaryAmount(
      ticketDocInfo,
      "fareDetail.farePriceType[0].price.totalAmount"
    );

    // Extract tax breakdown
    const taxBreakdown = extractTaxBreakdown(ticketDocInfo, ticketIndex);

    // Extract ticket type
    const ticketType = validTicket?.coupon?.[0]?.couponStatusCode || null;

    // Extract segments (coupons)
    const segments: SegmentInfo[] = [];

    if (validTicket && validTicketIndex >= 0) {
      const coupons = validTicket.coupon || [];
      coupons.forEach((coupon: any, couponIdx: number) => {
        const segmentInfo = extractSegmentInfo(
          data,
          coupon,
          ticketIndex,
          validTicketIndex,
          couponIdx,
          ticketDocInfo
        );
        segments.push(segmentInfo);
      });
    }
    const seatAmount = seatDetails
      ?.filter((record: any) => record?.paxRefId === ticketDocInfo?.paxRefId)
      ?.reduce(
        (sum: any, item: any) => sum + Number(item.price.totalAmount.cdata),
        0
      );

    tickets.push({
      ticketNumber: ticketNumber,
      issueDate: issueDate,
      issueTime: issueTime,
      passenger,
      baseFare: baseFare,
      totalTax: totalTax,
      taxBreakdown: taxBreakdown,
      totalAmount: totalAmount,
      ticketType: ticketType,
      segments,
      seatAmount,
      reportingTypeCode,
      ref: ticketDocPath,
    });
  });

  return tickets;
}

// /**
//  * Extract Final tickets
//  */
// export function extractFinalTickets(data: any): TicketInfo[] {
//   const collectPaxRefIds: string[] = [];
//   for (const item of data) {
//     const itemPaxRefId = item?.passenger.paxRefId;
//     if (!collectPaxRefIds.includes(itemPaxRefId)) {
//       collectPaxRefIds.push(itemPaxRefId);
//     }
//   }
//   console.log("collectPaxRefIdsssssssssssssssssssssssssssss", collectPaxRefIds);
//   if (collectPaxRefIds && collectPaxRefIds.length > 0) {
//     let finalTickets: TicketInfo[] = [];
//     for (const paxRefId of collectPaxRefIds) {
//       const filterByPaxRefId = data?.filter(
//         (item: TicketInfo) => item?.passenger?.paxRefId === paxRefId
//       );
//       if (filterByPaxRefId && filterByPaxRefId.length > 0) {
//         if (filterByPaxRefId.length > 1) {
//            console.log("filterByPaxRefIdddddddddddddd", filterByPaxRefId);
//         } else {
//           finalTickets = [finalTickets, ...filterByPaxRefId];
//         }
//       }
//     }
//   }

//   return data;
// }

/**
 * Main function to extract complete order summary
 */
export function extractOrderSummary(orderData: any): OrderSummary {
  const orderDetails = extractOrderDetails(orderData);
  const tickets = extractTickets(orderData);

  return {
    orderDetails: orderDetails,
    tickets,
  };
}
