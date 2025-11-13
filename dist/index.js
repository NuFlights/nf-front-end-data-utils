"use strict";
/**
 * nf-ndc-order-utils
 *
 * Utility module for extracting attributes from IATA NDC Order View JSON documents
 * and returning a simplified JSON structure with source references.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTickets = exports.extractOrderDetails = exports.extractOrderSummary = void 0;
var extractors_1 = require("./../src/OrderView/extractors");
Object.defineProperty(exports, "extractOrderSummary", { enumerable: true, get: function () { return extractors_1.extractOrderSummary; } });
Object.defineProperty(exports, "extractOrderDetails", { enumerable: true, get: function () { return extractors_1.extractOrderDetails; } });
Object.defineProperty(exports, "extractTickets", { enumerable: true, get: function () { return extractors_1.extractTickets; } });
