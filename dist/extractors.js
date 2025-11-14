"use strict";
/**
 * Extractor functions for NDC Order data
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractOrderDetails = extractOrderDetails;
exports.extractTickets = extractTickets;
exports.extractOrderSummary = extractOrderSummary;
var jmespath = __importStar(require("jmespath"));
var ERROR_NOT_FOUND = "Value not found at path";
var ERROR_EXTRACTION_FAILED = "Extraction failed";
/**
 * Safely extract value using JMESPath with error handling
 */
function safeExtract(data, path, defaultValue) {
    if (defaultValue === void 0) { defaultValue = null; }
    try {
        var result = jmespath.search(data, path);
        return result !== null && result !== undefined ? result : defaultValue;
    }
    catch (error) {
        return defaultValue;
    }
}
/**
 * Create error reference
 */
function errorRef(path, error) {
    if (error === void 0) { error = ERROR_NOT_FOUND; }
    return "ERROR: ".concat(error, " - ").concat(path);
}
/**
 * Extract booking reference (PNR)
 * Uses the orderId from the response
 */
function extractBookingReference(data) {
    var path = "iataOrderRetrieve.response.order[0].orderItem[0].service[0].bookingRef[0].bookingId";
    var value = safeExtract(data, path);
    return {
        value: value,
        ref: value !== null ? path : errorRef(path),
    };
}
/**
 * Extract issuing office information
 * In the new structure, uses servicingAgency from ticketDocInfo
 */
function extractIssuingOffice(data) {
    var _a, _b;
    var basePath = "iataOrderRetrieve.response.ticketDocInfo[0].servicingAgency";
    var agency = safeExtract(data, basePath);
    if (agency && typeof agency === "object") {
        return {
            orgId: ((_a = agency.agencyId) === null || _a === void 0 ? void 0 : _a.toString()) || null,
            orgName: null,
            orgRole: "ServicingAgency",
            salesAgentId: ((_b = agency.iataNumber) === null || _b === void 0 ? void 0 : _b.toString()) || null,
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
function extractPCC(data) {
    var path = "iataOrderRetrieve.response.ticketDocInfo[0].servicingAgency.agencyId";
    var value = safeExtract(data, path);
    return {
        value: (value === null || value === void 0 ? void 0 : value.toString()) || null,
        ref: value !== null ? path : errorRef(path, "PCC not found - using agencyId"),
    };
}
/**
 * Extract order details
 */
function extractOrderDetails(data) {
    var bookingRef = extractBookingReference(data);
    var issuingOffice = extractIssuingOffice(data);
    var pcc = extractPCC(data);
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
function extractPassengerInfo(data, paxRefId) {
    var paxListPath = "iataOrderRetrieve.response.dataLists.paxList.pax";
    var paxList = safeExtract(data, paxListPath, []);
    if (!Array.isArray(paxList)) {
        return null;
    }
    // Handle both single string and array of strings
    var refIds = Array.isArray(paxRefId) ? paxRefId : [paxRefId];
    // Find passenger matching any of the reference IDs
    var paxIndex = -1;
    var passenger = null;
    for (var i = 0; i < paxList.length; i++) {
        // Check both paxRefId and paxId
        if (refIds.includes(paxList[i].paxRefId) ||
            refIds.includes(paxList[i].paxId)) {
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
            ref: errorRef(paxListPath, "Passenger not found for ref_id: ".concat(refIds.join(", "))),
        };
    }
    var paxPath = "".concat(paxListPath, "[").concat(paxIndex, "]");
    var individual = passenger.individual || {};
    // Extract given names (array) and join with space
    var givenNames = Array.isArray(individual.givenName)
        ? individual.givenName.join(" ").toUpperCase()
        : (individual.givenName || "").toUpperCase();
    // Extract middle names (array) and join with space
    var middleNames = Array.isArray(individual.middleName)
        ? individual.middleName.join(" ").toUpperCase()
        : (individual.middleName || "").toUpperCase();
    // Extract surname
    var surname = (individual.surname || "").toUpperCase();
    // Extract title
    var title = (individual.titleName || "").toUpperCase();
    // Extract PTC
    var ptc = (passenger.ptc || "").toUpperCase();
    // Extract loyalty programs
    var loyaltyPrograms = [];
    if (Array.isArray(passenger.loyaltyProgramAccount)) {
        passenger.loyaltyProgramAccount.forEach(function (program, idx) {
            var _a, _b, _c, _d;
            loyaltyPrograms.push({
                accountNumber: program.accountNumber || null,
                programCode: ((_a = program.loyaltyProgram) === null || _a === void 0 ? void 0 : _a.programCode) || null,
                programName: ((_b = program.loyaltyProgram) === null || _b === void 0 ? void 0 : _b.programName) || null,
                carrier: ((_d = (_c = program.loyaltyProgram) === null || _c === void 0 ? void 0 : _c.carrier) === null || _d === void 0 ? void 0 : _d.airlineDesigCode) || null,
                ref: "".concat(paxPath, ".loyaltyProgramAccount[").concat(idx, "]"),
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
function extractMonetaryAmount(data, basePath) {
    var amountObj = safeExtract(data, basePath);
    if (amountObj && typeof amountObj === "object") {
        return {
            amount: amountObj.cdata !== undefined && amountObj.cdata !== null
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
function extractTaxBreakdown(ticketDocInfo, ticketIndex) {
    var _a;
    var taxes = [];
    var farePriceTypes = ((_a = ticketDocInfo.fareDetail) === null || _a === void 0 ? void 0 : _a.farePriceType) || [];
    farePriceTypes.forEach(function (priceType, ptIdx) {
        var _a;
        var taxSummaries = ((_a = priceType.price) === null || _a === void 0 ? void 0 : _a.taxSummary) || [];
        taxSummaries.forEach(function (summary, tsIdx) {
            var taxList = summary.tax || [];
            if (Array.isArray(taxList)) {
                taxList.forEach(function (tax, taxIdx) {
                    var _a, _b, _c;
                    var basePath = "ticketDocInfo[".concat(ticketIndex, "].fareDetail.farePriceType[").concat(ptIdx, "].price.taxSummary[").concat(tsIdx, "].tax[").concat(taxIdx, "]");
                    taxes.push({
                        taxCode: tax.taxCode || null,
                        amount: ((_a = tax.amount) === null || _a === void 0 ? void 0 : _a.cdata) !== undefined && ((_b = tax.amount) === null || _b === void 0 ? void 0 : _b.cdata) !== null
                            ? Number(tax.amount.cdata)
                            : null,
                        currency: ((_c = tax.amount) === null || _c === void 0 ? void 0 : _c.curCode) || null,
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
function extractBaggageAllowance(data, baggageRefIds) {
    var _a, _b, _c, _d, _e;
    if (!baggageRefIds || baggageRefIds.length === 0) {
        return null;
    }
    var baggageListPath = "iataOrderRetrieve.response.dataLists.baggageAllowanceList.baggageAllowance";
    var baggageList = safeExtract(data, baggageListPath, []);
    if (!Array.isArray(baggageList)) {
        return {
            pieceQty: null,
            weightValue: null,
            weightUnit: null,
            ref: errorRef(baggageListPath, "Baggage allowance list not found"),
        };
    }
    // Find first matching baggage allowance
    for (var i = 0; i < baggageList.length; i++) {
        if (baggageRefIds.includes(baggageList[i].baggageAllowanceId)) {
            var baggage = baggageList[i];
            var baggagePath = "".concat(baggageListPath, "[").concat(i, "]");
            return {
                pieceQty: ((_a = baggage.pieceAllowance) === null || _a === void 0 ? void 0 : _a.totalQty) || null,
                weightValue: ((_c = (_b = baggage.weightAllowance) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.maximumWeightMeasure) || null,
                weightUnit: ((_e = (_d = baggage.weightAllowance) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.weightUnitOfMeasurement) || null,
                ref: baggagePath,
            };
        }
    }
    return {
        pieceQty: null,
        weightValue: null,
        weightUnit: null,
        ref: errorRef(baggageListPath, "Baggage allowance not found for ref_ids: ".concat(baggageRefIds.join(", "))),
    };
}
/**
 * Extract segment information from coupon
 */
function extractSegmentInfo(data, coupon, ticketIndex, ticketIdx, couponIdx) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var couponPath = "ticketDocInfo[".concat(ticketIndex, "].ticket[").concat(ticketIdx, "].coupon[").concat(couponIdx, "]");
    // Get segment reference ID
    var segmentRefIds = ((_b = (_a = coupon.currentCouponFlightInfoRef) === null || _a === void 0 ? void 0 : _a.currentAirlinePaxSegmentRef) === null || _b === void 0 ? void 0 : _b.paxSegmentRefId) ||
        ((_d = (_c = coupon.currentCouponFlightInfoRef) === null || _c === void 0 ? void 0 : _c.flownAirlinePaxSegmentRef) === null || _d === void 0 ? void 0 : _d.paxSegmentRefId) ||
        ((_f = (_e = coupon.currentCouponFlightInfoRef) === null || _e === void 0 ? void 0 : _e.checkedInAirlinePaxSegmentRef) === null || _f === void 0 ? void 0 : _f.paxSegmentRefId) ||
        [];
    var refIdArray = Array.isArray(segmentRefIds)
        ? segmentRefIds
        : [segmentRefIds];
    var segmentRefId = refIdArray[0] || null;
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
            ref: errorRef(couponPath, "Segment reference not found"),
        };
    }
    // Find segment in pax_segment list
    var paxSegmentListPath = "iataOrderRetrieve.response.dataLists.paxSegmentList.paxSegment";
    var paxSegmentList = safeExtract(data, paxSegmentListPath, []);
    var paxSegment = null;
    var paxSegmentIndex = -1;
    if (Array.isArray(paxSegmentList)) {
        for (var i = 0; i < paxSegmentList.length; i++) {
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
            rbd: (paxSegment === null || paxSegment === void 0 ? void 0 : paxSegment.marketingCarrierRbdCode) || null,
            departureDatetime: null,
            couponStatus: coupon.couponStatusCode || null,
            fareBasisCode: coupon.fareBasisCode || null,
            baggageAllowance: extractBaggageAllowance(data, coupon.baggageAllowanceRefId || []),
            couponNumber: coupon.couponNumber || null,
            cabinTypeCode: null,
            ref: errorRef(paxSegmentListPath, "Segment not found for ref_id: ".concat(segmentRefId)),
        };
    }
    // Get marketing segment reference
    var marketingSegmentRefId = paxSegment.datedMarketingSegmentRefId;
    var rbd = paxSegment.marketingCarrierRbdCode || null;
    var fareBasisCode = coupon.fareBasisCode || null;
    var cabinTypeCode = null;
    var orderItemPath = "iataOrderRetrieve.response.order[0].orderItem";
    var orderItems = safeExtract(data, orderItemPath, []);
    if (rbd === null || fareBasisCode === null) {
        if (Array.isArray(orderItems)) {
            for (var _i = 0, orderItems_1 = orderItems; _i < orderItems_1.length; _i++) {
                var orderItem = orderItems_1[_i];
                var orderItemFareDetailPath = orderItem.fareDetail;
                for (var _k = 0, orderItemFareDetailPath_1 = orderItemFareDetailPath; _k < orderItemFareDetailPath_1.length; _k++) {
                    var fareDetail = orderItemFareDetailPath_1[_k];
                    var orderItemFareDetailFareComponentPath = fareDetail.fareComponent;
                    for (var _l = 0, orderItemFareDetailFareComponentPath_1 = orderItemFareDetailFareComponentPath; _l < orderItemFareDetailFareComponentPath_1.length; _l++) {
                        var fareComponent = orderItemFareDetailFareComponentPath_1[_l];
                        if (fareComponent.paxSegmentRefId.includes(segmentRefId)) {
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
    // Find marketing segment
    var marketingSegmentListPath = "iataOrderRetrieve.response.dataLists.datedMarketingSegmentList.datedMarketingSegment";
    var marketingSegmentList = safeExtract(data, marketingSegmentListPath, []);
    var marketingSegment = null;
    if (Array.isArray(marketingSegmentList)) {
        for (var _m = 0, marketingSegmentList_1 = marketingSegmentList; _m < marketingSegmentList_1.length; _m++) {
            var segment = marketingSegmentList_1[_m];
            if (segment.datedMarketingSegmentId === marketingSegmentRefId) {
                marketingSegment = segment;
                break;
            }
        }
    }
    var origin = ((_g = marketingSegment === null || marketingSegment === void 0 ? void 0 : marketingSegment.dep) === null || _g === void 0 ? void 0 : _g.iataLocationCode) || null;
    var destination = ((_h = marketingSegment === null || marketingSegment === void 0 ? void 0 : marketingSegment.arrival) === null || _h === void 0 ? void 0 : _h.iataLocationCode) || null;
    var departureDateTime = ((_j = marketingSegment === null || marketingSegment === void 0 ? void 0 : marketingSegment.dep) === null || _j === void 0 ? void 0 : _j.aircraftScheduledDateTime) || null;
    return {
        segmentRefId: segmentRefId,
        origin: origin,
        destination: destination,
        rbd: rbd,
        departureDatetime: departureDateTime,
        couponStatus: coupon.couponStatusCode || null,
        fareBasisCode: fareBasisCode,
        baggageAllowance: extractBaggageAllowance(data, coupon.baggageAllowanceRefId || []),
        couponNumber: coupon.couponNumber || null,
        cabinTypeCode: cabinTypeCode || null,
        ref: "".concat(paxSegmentListPath, "[").concat(paxSegmentIndex, "]"),
    };
}
/**
 * Extract all tickets
 */
function extractTickets(data) {
    var tickets = [];
    var ticketDocInfoPath = "iataOrderRetrieve.response.ticketDocInfo";
    var ticketDocInfoList = safeExtract(data, ticketDocInfoPath, []);
    if (!Array.isArray(ticketDocInfoList)) {
        return tickets;
    }
    ticketDocInfoList.forEach(function (ticketDocInfo, ticketIndex) {
        var _a, _b, _c;
        var ticketDocPath = "".concat(ticketDocInfoPath, "[").concat(ticketIndex, "]");
        // Find ticket with status 'T' (valid ticket) or use first ticket
        var ticketList = ticketDocInfo.ticket || [];
        var validTicket = null;
        var validTicketIndex = -1;
        for (var i = 0; i < ticketList.length; i++) {
            if (ticketList[i].ticketStatusCode === "T") {
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
        var reportingTypeCode = null;
        if (validTicket) {
            reportingTypeCode = validTicket.reportingTypeCode;
        }
        // Get ticket number from originalIssueInfo or ticket
        var ticketNumber = ((_a = ticketDocInfo.originalIssueInfo) === null || _a === void 0 ? void 0 : _a.ticketNumber) ||
            (validTicket === null || validTicket === void 0 ? void 0 : validTicket.ticketNumber) ||
            null;
        var issueDate = ((_b = ticketDocInfo.originalIssueInfo) === null || _b === void 0 ? void 0 : _b.issueDate) || null;
        var issueTime = ((_c = ticketDocInfo.originalIssueInfo) === null || _c === void 0 ? void 0 : _c.issueTime) || null;
        // Extract passenger info
        var paxRefId = ticketDocInfo.paxRefId;
        var passenger = paxRefId ? extractPassengerInfo(data, paxRefId) : null;
        // Extract fare information
        var baseFare = extractMonetaryAmount(ticketDocInfo, "fareDetail.farePriceType[0].price.baseAmount");
        var totalTax = extractMonetaryAmount(ticketDocInfo, "fareDetail.farePriceType[0].price.taxSummary[0].totalTaxAmount");
        var totalAmount = extractMonetaryAmount(ticketDocInfo, "fareDetail.farePriceType[0].price.totalAmount");
        // Extract tax breakdown
        var taxBreakdown = extractTaxBreakdown(ticketDocInfo, ticketIndex);
        // Extract ticket type
        var ticketType = (validTicket === null || validTicket === void 0 ? void 0 : validTicket.ticketDocTypeCode) || null;
        // Extract segments (coupons)
        var segments = [];
        if (validTicket && validTicketIndex >= 0) {
            var coupons = validTicket.coupon || [];
            coupons.forEach(function (coupon, couponIdx) {
                var segmentInfo = extractSegmentInfo(data, coupon, ticketIndex, validTicketIndex, couponIdx);
                segments.push(segmentInfo);
            });
        }
        tickets.push({
            ticketNumber: ticketNumber,
            issueDate: issueDate,
            issueTime: issueTime,
            passenger: passenger,
            baseFare: baseFare,
            totalTax: totalTax,
            taxBreakdown: taxBreakdown,
            totalAmount: totalAmount,
            ticketType: ticketType,
            segments: segments,
            reportingTypeCode: reportingTypeCode,
            ref: ticketDocPath,
        });
    });
    return tickets;
}
/**
 * Main function to extract complete order summary
 */
function extractOrderSummary(orderData) {
    var orderDetails = extractOrderDetails(orderData);
    var tickets = extractTickets(orderData);
    return {
        orderDetails: orderDetails,
        tickets: tickets,
    };
}
