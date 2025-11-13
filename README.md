# nf-ndc-order-utils

A TypeScript utility module for extracting attributes from IATA NDC Order View JSON documents and returning a simplified JSON structure with source references.

## Features

- **Efficient Data Extraction**: Uses JMESPath (jq-compatible library) for efficient JSON querying
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Graceful error handling with detailed error references
- **Source Tracking**: Every extracted value includes a `ref` attribute indicating the source path
- **Comprehensive Coverage**: Extracts all key order attributes including:
  - Order details (booking reference, issuing office, PCC)
  - Ticket information (ticket numbers, issue dates, types)
  - Passenger details (names, types, loyalty programs)
  - Fare breakdown (base fare, taxes, total amounts)
  - Segment/itinerary details (origin, destination, dates, baggage allowance)

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Usage

### Basic Usage

```typescript
import { extractOrderSummary } from 'nf-ndc-order-utils';

// Load your NDC Order View JSON
const orderData = require('./order_view_rs_example.json');

// Extract the simplified summary
const summary = extractOrderSummary(orderData);

console.log(summary);
```

### Output Structure

The `extractOrderSummary` function returns an `OrderSummary` object with the following structure:

```typescript
{
  order_details: {
    booking_reference: string | null,
    issuing_office: {
      org_id: string | null,
      org_name: string | null,
      org_role: string | null,
      sales_agent_id: string | null,
      sales_branch_id: string | null,
      ref: string  // Path to source or error message
    },
    pcc: string | null,
    ref: string
  },
  tickets: [
    {
      ticket_number: string | null,
      issue_date: string | null,
      issue_time: string | null,
      passenger: {
        pax_ref_id: string | null,
        given_name: string | null,
        surname: string | null,
        middle_name: string | null,
        title: string | null,
        ptc: string | null,
        loyalty_programs: [
          {
            account_number: string | null,
            program_code: string | null,
            program_name: string | null,
            carrier: string | null,
            ref: string
          }
        ],
        ref: string
      },
      base_fare: {
        amount: number | null,
        currency: string | null,
        ref: string
      },
      total_tax: {
        amount: number | null,
        currency: string | null,
        ref: string
      },
      tax_breakdown: [
        {
          tax_code: string | null,
          amount: number | null,
          currency: string | null,
          tax_name: string | null,
          tax_type: string | null,
          ref: string
        }
      ],
      total_amount: {
        amount: number | null,
        currency: string | null,
        ref: string
      },
      ticket_type: string | null,
      segments: [
        {
          segment_ref_id: string | null,
          origin: string | null,
          destination: string | null,
          rbd: string | null,
          departure_datetime: string | null,
          coupon_status: string | null,
          fare_basis_code: string | null,
          baggage_allowance: {
            piece_qty: number | null,
            weight_value: number | null,
            weight_unit: string | null,
            ref: string
          },
          coupon_number: string | null,
          ref: string
        }
      ],
      ref: string
    }
  ]
}
```

### Reference Attributes

Every extracted value includes a `ref` attribute that shows:
- **Success**: The exact JMESPath to the source data (e.g., `IATA_OrderViewRS.response.ticket_doc_info[0].ticket[0].ticket_number`)
- **Error**: An error message with the attempted path (e.g., `ERROR: Value not found at path - IATA_OrderViewRS.response.ticket_doc_info[0].carrier_fee.grand_total_amount`)

This allows you to:
- Trace back to the original data source
- Debug extraction issues
- Validate data availability

## Testing

Run the included test script to process the example JSON:

```bash
npm test
```

This will:
1. Load `order_view_rs_example.json`
2. Extract the order summary
3. Display formatted output to console
4. Save the JSON output to `order_summary_output.json`

## API Reference

### Functions

#### `extractOrderSummary(orderData: any): OrderSummary`

Main function that extracts a complete order summary from an IATA NDC Order View response.

**Parameters:**
- `orderData`: The IATA_OrderViewRS JSON object

**Returns:** Complete `OrderSummary` object with all extracted data and references

#### `extractOrderDetails(data: any): OrderDetails`

Extracts order-level details (booking reference, issuing office, PCC).

#### `extractTickets(data: any): TicketInfo[]`

Extracts all tickets from the order with passenger, fare, and segment information.

### Types

All TypeScript types are exported and can be imported:

```typescript
import {
  OrderSummary,
  OrderDetails,
  TicketInfo,
  PassengerInfo,
  SegmentInfo,
  MonetaryAmount,
  TaxBreakdown,
  BaggageAllowance,
  IssuingOffice,
  LoyaltyProgram
} from 'nf-ndc-order-utils';
```

## Field Mapping

The extraction follows the mapping defined in `order-view-summary.txt`, which documents:
- All extraction paths from the NDC Order View schema
- Relationships between entities (tickets, passengers, segments)
- Data type conventions and formats
- Reference resolution strategies

## Error Handling

The module gracefully handles missing or malformed data:
- Returns `null` for missing primitive values
- Returns empty arrays for missing collections
- Includes error messages in `ref` attributes when extraction fails
- Never throws exceptions during extraction

## Development

### Project Structure

```
nf-ndc-order-utils/
├── src/
│   ├── index.ts         # Main entry point
│   ├── types.ts         # TypeScript type definitions
│   ├── extractors.ts    # Extraction logic
│   └── test.ts          # Test script
├── dist/                # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

### Development Mode

Watch mode for automatic recompilation:

```bash
npm run dev
```

## Dependencies

- **jmespath** (^0.16.0): JMESPath query language for JSON
- **TypeScript** (^5.0.0): TypeScript compiler
- **@types/jmespath** (^0.15.2): Type definitions for JMESPath
- **@types/node** (^20.0.0): Node.js type definitions

## License

MIT

## Author

Generated with Claude Code