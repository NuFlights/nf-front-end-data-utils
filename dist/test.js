"use strict";
/**
 * Test file for nf-ndc-order-utils
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
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var extractors_1 = require("./extractors");
// Load the example JSON file
// const exampleFilePath = path.join(
//   process.cwd(),
//   "src",
//   "OrderView",
//   "test",
//   "order_view_rs_example.json"
// );
var exampleFilePath = path.join(__dirname, '..', 'order_view_rs_example.json');
console.log("exampleFilePath", exampleFilePath);
console.log("Loading order view example JSON...");
console.log("File path: ".concat(exampleFilePath));
try {
    var rawData = fs.readFileSync(exampleFilePath, "utf-8");
    var orderData = JSON.parse(rawData);
    console.log("JSON loaded successfully\n");
    console.log("Extracting order summary...\n");
    var summary = (0, extractors_1.extractOrderSummary)(orderData);
    // Print full extracted JSON
    console.log("=".repeat(80));
    console.log("FULL EXTRACTED JSON");
    console.log("=".repeat(80));
    console.log(JSON.stringify(summary, null, 2));
    console.log();
    console.log("=".repeat(80));
    console.log();
    // Output the formatted summary
    console.log("=".repeat(80));
    console.log("ORDER SUMMARY EXTRACTION RESULTS (FORMATTED VIEW)");
    console.log("=".repeat(80));
    console.log();
    // Order Details
    console.log("ORDER DETAILS");
    console.log("-".repeat(80));
    console.log("Booking Reference: ".concat(summary.orderDetails.bookingReference));
    console.log("  ref: ".concat(summary.orderDetails.ref));
    console.log();
    console.log("Issuing Office:");
    console.log("  Organization ID: ".concat(summary.orderDetails.issuingOffice.orgId));
    console.log("  Organization Name: ".concat(summary.orderDetails.issuingOffice.orgName));
    console.log("  Organization Role: ".concat(summary.orderDetails.issuingOffice.orgRole));
    console.log("  Sales Agent ID: ".concat(summary.orderDetails.issuingOffice.salesAgentId));
    console.log("  Sales Branch ID: ".concat(summary.orderDetails.issuingOffice.salesBranchId));
    console.log("  ref: ".concat(summary.orderDetails.issuingOffice.ref));
    console.log();
    console.log("PCC: ".concat(summary.orderDetails.pcc));
    console.log();
    // Tickets
    console.log("TICKETS");
    console.log("-".repeat(80));
    console.log("Total Tickets: ".concat(summary.tickets.length));
    console.log();
    summary.tickets.forEach(function (ticket, idx) {
        console.log("\nTicket #".concat(idx + 1));
        console.log("  ".repeat(1) + "=".repeat(76));
        console.log("  Ticket Number: ".concat(ticket.ticketNumber));
        console.log("  Issue Date: ".concat(ticket.issueDate));
        console.log("  Issue Time: ".concat(ticket.issueTime));
        console.log("  Ticket Type: ".concat(ticket.ticketType));
        console.log("  FOP Type: ".concat(ticket.reportingTypeCode));
        console.log("  ref: ".concat(ticket.ref));
        console.log();
        // Passenger
        if (ticket.passenger) {
            console.log("  Passenger Information:");
            console.log("    Name: ".concat(ticket.passenger.title, " ").concat(ticket.passenger.givenName, " ").concat(ticket.passenger.middleName || "", " ").concat(ticket.passenger.surname).replace(/\s+/g, " "));
            console.log("    Passenger Type: ".concat(ticket.passenger.ptc));
            console.log("    ref: ".concat(ticket.passenger.ref));
            if (ticket.passenger.loyaltyPrograms.length > 0) {
                console.log("    Loyalty Programs:");
                ticket.passenger.loyaltyPrograms.forEach(function (lp, lpIdx) {
                    console.log("      [".concat(lpIdx + 1, "] ").concat(lp.programCode, " - ").concat(lp.accountNumber, " (").concat(lp.carrier, ")"));
                    console.log("          ref: ".concat(lp.ref));
                });
            }
            console.log();
        }
        // Fare Information
        console.log("  Fare Information:");
        console.log("    Base Fare: ".concat(ticket.baseFare.amount, " ").concat(ticket.baseFare.currency));
        console.log("      ref: ".concat(ticket.baseFare.ref));
        console.log("    Total Tax: ".concat(ticket.totalTax.amount, " ").concat(ticket.totalTax.currency));
        console.log("      ref: ".concat(ticket.totalTax.ref));
        console.log("    Total Amount: ".concat(ticket.totalAmount.amount, " ").concat(ticket.totalAmount.currency));
        console.log("      ref: ".concat(ticket.totalAmount.ref));
        console.log();
        // Tax Breakdown
        if (ticket.taxBreakdown.length > 0) {
            console.log("    Tax Breakdown:");
            ticket.taxBreakdown.forEach(function (tax, taxIdx) {
                console.log("      [".concat(taxIdx + 1, "] ").concat(tax.taxCode, ": ").concat(tax.amount, " ").concat(tax.currency, " (").concat(tax.taxName || "N/A", ")"));
                console.log("          ref: ".concat(tax.ref));
            });
            console.log();
        }
        // Segments
        console.log("  Segments/Itinerary (".concat(ticket.segments.length, " segments):"));
        ticket.segments.forEach(function (segment, segIdx) {
            console.log("    [".concat(segIdx + 1, "] ").concat(segment.origin || "N/A", " -> ").concat(segment.destination || "N/A"));
            console.log("        Departure: ".concat(segment.departureDatetime));
            console.log("        RBD: ".concat(segment.rbd, ", Fare Basis: ").concat(segment.fareBasisCode, ", Cabin Type Code: ").concat(segment.cabinTypeCode));
            console.log("        Status: ".concat(segment.couponStatus, ", Coupon #: ").concat(segment.couponNumber));
            if (segment.baggageAllowance) {
                var bag = segment.baggageAllowance;
                var baggageStr = bag.pieceQty
                    ? "".concat(bag.pieceQty, " pieces")
                    : bag.weightValue
                        ? "".concat(bag.weightValue, " ").concat(bag.weightUnit)
                        : "N/A";
                console.log("        Baggage: ".concat(baggageStr));
                console.log("        Baggage ref: ".concat(bag.ref));
            }
            console.log("        ref: ".concat(segment.ref));
        });
        console.log();
    });
    console.log("=".repeat(80));
    console.log("Extraction complete!");
    console.log("=".repeat(80));
    // Write output to file
    var outputPath = path.join(__dirname, "..", "order_summary_output.json");
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), "utf-8");
    console.log("\nOutput also saved to: ".concat(outputPath));
}
catch (error) {
    console.error("Error during extraction:");
    console.error(error);
    process.exit(1);
}
