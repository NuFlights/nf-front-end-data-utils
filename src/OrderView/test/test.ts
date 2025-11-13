/**
 * Test file for nf-ndc-order-utils
 */

import * as fs from "fs";
import * as path from "path";
import { extractOrderSummary } from "./../extractors";

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

  const summary = extractOrderSummary(orderData);

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
  console.log(`Booking Reference: ${summary.order_details.booking_reference}`);
  console.log(`  ref: ${summary.order_details.ref}`);
  console.log();
  console.log("Issuing Office:");
  console.log(
    `  Organization ID: ${summary.order_details.issuing_office.org_id}`
  );
  console.log(
    `  Organization Name: ${summary.order_details.issuing_office.org_name}`
  );
  console.log(
    `  Organization Role: ${summary.order_details.issuing_office.org_role}`
  );
  console.log(
    `  Sales Agent ID: ${summary.order_details.issuing_office.sales_agent_id}`
  );
  console.log(
    `  Sales Branch ID: ${summary.order_details.issuing_office.sales_branch_id}`
  );
  console.log(`  ref: ${summary.order_details.issuing_office.ref}`);
  console.log();
  console.log(`PCC: ${summary.order_details.pcc}`);
  console.log();

  // Tickets
  console.log("TICKETS");
  console.log("-".repeat(80));
  console.log(`Total Tickets: ${summary.tickets.length}`);
  console.log();

  summary.tickets.forEach((ticket, idx) => {
    console.log(`\nTicket #${idx + 1}`);
    console.log("  ".repeat(1) + "=".repeat(76));
    console.log(`  Ticket Number: ${ticket.ticket_number}`);
    console.log(`  Issue Date: ${ticket.issue_date}`);
    console.log(`  Issue Time: ${ticket.issue_time}`);
    console.log(`  Ticket Type: ${ticket.ticket_type}`);
    console.log(`  FOP Type: ${ticket.reportingTypeCode}`);
    console.log(`  ref: ${ticket.ref}`);
    console.log();

    // Passenger
    if (ticket.passenger) {
      console.log("  Passenger Information:");
      console.log(
        `    Name: ${ticket.passenger.title} ${ticket.passenger.given_name} ${
          ticket.passenger.middle_name || ""
        } ${ticket.passenger.surname}`.replace(/\s+/g, " ")
      );
      console.log(`    Passenger Type: ${ticket.passenger.ptc}`);
      console.log(`    ref: ${ticket.passenger.ref}`);

      if (ticket.passenger.loyalty_programs.length > 0) {
        console.log("    Loyalty Programs:");
        ticket.passenger.loyalty_programs.forEach((lp, lpIdx) => {
          console.log(
            `      [${lpIdx + 1}] ${lp.program_code} - ${lp.account_number} (${
              lp.carrier
            })`
          );
          console.log(`          ref: ${lp.ref}`);
        });
      }
      console.log();
    }

    // Fare Information
    console.log("  Fare Information:");
    console.log(
      `    Base Fare: ${ticket.base_fare.amount} ${ticket.base_fare.currency}`
    );
    console.log(`      ref: ${ticket.base_fare.ref}`);
    console.log(
      `    Total Tax: ${ticket.total_tax.amount} ${ticket.total_tax.currency}`
    );
    console.log(`      ref: ${ticket.total_tax.ref}`);
    console.log(
      `    Total Amount: ${ticket.total_amount.amount} ${ticket.total_amount.currency}`
    );
    console.log(`      ref: ${ticket.total_amount.ref}`);
    console.log();

    // Tax Breakdown
    if (ticket.tax_breakdown.length > 0) {
      console.log("    Tax Breakdown:");
      ticket.tax_breakdown.forEach((tax, taxIdx) => {
        console.log(
          `      [${taxIdx + 1}] ${tax.tax_code}: ${tax.amount} ${
            tax.currency
          } (${tax.tax_name || "N/A"})`
        );
        console.log(`          ref: ${tax.ref}`);
      });
      console.log();
    }

    // Segments
    console.log(`  Segments/Itinerary (${ticket.segments.length} segments):`);
    ticket.segments.forEach((segment, segIdx) => {
      console.log(
        `    [${segIdx + 1}] ${segment.origin || "N/A"} -> ${
          segment.destination || "N/A"
        }`
      );
      console.log(`        Departure: ${segment.departure_datetime}`);
      console.log(
        `        RBD: ${segment.rbd}, Fare Basis: ${segment.fare_basis_code}, Cabin Type Code: ${segment.cabin_type_code}`
      );
      console.log(
        `        Status: ${segment.coupon_status}, Coupon #: ${segment.coupon_number}`
      );
      if (segment.baggage_allowance) {
        const bag = segment.baggage_allowance;
        const baggageStr = bag.piece_qty
          ? `${bag.piece_qty} pieces`
          : bag.weight_value
          ? `${bag.weight_value} ${bag.weight_unit}`
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
} catch (error) {
  console.error("Error during extraction:");
  console.error(error);
  process.exit(1);
}
