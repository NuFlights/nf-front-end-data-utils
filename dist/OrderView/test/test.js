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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const extractors_1 = require("./../extractors");
// Load the example JSON file
const exampleFilePath = path.join(process.cwd(), "src", "OrderView", "test", "order_view_rs_example.json");
console.log("exampleFilePath", exampleFilePath);
console.log("Loading order view example JSON...");
console.log(`File path: ${exampleFilePath}`);
try {
    const rawData = fs.readFileSync(exampleFilePath, "utf-8");
    const orderData = JSON.parse(rawData);
    console.log("JSON loaded successfully\n");
    console.log("Extracting order summary...\n");
    const summary = (0, extractors_1.extractOrderSummary)(orderData);
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
    console.log(`Booking Reference: ${summary.orderDetails.bookingReference}`);
    console.log(`  ref: ${summary.orderDetails.ref}`);
    console.log();
    console.log("Issuing Office:");
    console.log(`  Organization ID: ${summary.orderDetails.issuingOffice.orgId}`);
    console.log(`  Organization Name: ${summary.orderDetails.issuingOffice.orgName}`);
    console.log(`  Organization Role: ${summary.orderDetails.issuingOffice.orgRole}`);
    console.log(`  Sales Agent ID: ${summary.orderDetails.issuingOffice.salesAgentId}`);
    console.log(`  Sales Branch ID: ${summary.orderDetails.issuingOffice.salesBranchId}`);
    console.log(`  ref: ${summary.orderDetails.issuingOffice.ref}`);
    console.log();
    console.log(`PCC: ${summary.orderDetails.pcc}`);
    console.log();
    // Tickets
    console.log("TICKETS");
    console.log("-".repeat(80));
    console.log(`Total Tickets: ${summary.tickets.length}`);
    console.log();
    summary.tickets.forEach((ticket, idx) => {
        console.log(`\nTicket #${idx + 1}`);
        console.log("  ".repeat(1) + "=".repeat(76));
        console.log(`  Ticket Number: ${ticket.ticketNumber}`);
        console.log(`  Issue Date: ${ticket.issueDate}`);
        console.log(`  Issue Time: ${ticket.issueTime}`);
        console.log(`  Ticket Type: ${ticket.ticketType}`);
        console.log(`  FOP Type: ${ticket.reportingTypeCode}`);
        console.log(`  ref: ${ticket.ref}`);
        console.log();
        // Passenger
        if (ticket.passenger) {
            console.log("  Passenger Information:");
            console.log(`    Name: ${ticket.passenger.title} ${ticket.passenger.givenName} ${ticket.passenger.middleName || ""} ${ticket.passenger.surname}`.replace(/\s+/g, " "));
            console.log(`    Passenger Type: ${ticket.passenger.ptc}`);
            console.log(`    ref: ${ticket.passenger.ref}`);
            if (ticket.passenger.loyaltyPrograms.length > 0) {
                console.log("    Loyalty Programs:");
                ticket.passenger.loyaltyPrograms.forEach((lp, lpIdx) => {
                    console.log(`      [${lpIdx + 1}] ${lp.programCode} - ${lp.accountNumber} (${lp.carrier})`);
                    console.log(`          ref: ${lp.ref}`);
                });
            }
            console.log();
        }
        // Fare Information
        console.log("  Fare Information:");
        console.log(`    Base Fare: ${ticket.baseFare.amount} ${ticket.baseFare.currency}`);
        console.log(`      ref: ${ticket.baseFare.ref}`);
        console.log(`    Total Tax: ${ticket.totalTax.amount} ${ticket.totalTax.currency}`);
        console.log(`      ref: ${ticket.totalTax.ref}`);
        console.log(`    Total Amount: ${ticket.totalAmount.amount} ${ticket.totalAmount.currency}`);
        console.log(`      ref: ${ticket.totalAmount.ref}`);
        console.log();
        // Tax Breakdown
        if (ticket.taxBreakdown.length > 0) {
            console.log("    Tax Breakdown:");
            ticket.taxBreakdown.forEach((tax, taxIdx) => {
                console.log(`      [${taxIdx + 1}] ${tax.taxCode}: ${tax.amount} ${tax.currency} (${tax.taxName || "N/A"})`);
                console.log(`          ref: ${tax.ref}`);
            });
            console.log();
        }
        // Segments
        console.log(`  Segments/Itinerary (${ticket.segments.length} segments):`);
        ticket.segments.forEach((segment, segIdx) => {
            console.log(`    [${segIdx + 1}] ${segment.origin || "N/A"} -> ${segment.destination || "N/A"}`);
            console.log(`        Departure: ${segment.departureDatetime}`);
            console.log(`        RBD: ${segment.rbd}, Fare Basis: ${segment.fareBasisCode}, Cabin Type Code: ${segment.cabinTypeCode}`);
            console.log(`        Status: ${segment.couponStatus}, Coupon #: ${segment.couponNumber}`);
            if (segment.baggageAllowance) {
                const bag = segment.baggageAllowance;
                const baggageStr = bag.pieceQty
                    ? `${bag.pieceQty} pieces`
                    : bag.weightValue
                        ? `${bag.weightValue} ${bag.weightUnit}`
                        : "N/A";
                console.log(`        Baggage: ${baggageStr}`);
                console.log(`        Baggage ref: ${bag.ref}`);
            }
            console.log(`        ref: ${segment.ref}`);
        });
        console.log();
    });
    console.log("=".repeat(80));
    console.log("Extraction complete!");
    console.log("=".repeat(80));
    // Write output to file
    const outputPath = path.join(__dirname, "..", "order_summary_output.json");
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), "utf-8");
    console.log(`\nOutput also saved to: ${outputPath}`);
}
catch (error) {
    console.error("Error during extraction:");
    console.error(error);
    process.exit(1);
}
