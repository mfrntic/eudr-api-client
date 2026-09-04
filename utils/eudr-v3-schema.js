/**
 * Shared V3 schema constants, taken from the live acceptance XSD
 * (EUDRDueDiligenceStatementServiceV3?xsd=3, namespace .../eudr/common/v3).
 *
 * Kept in one place because DDS and SD share the same common types, and drift between
 * the two clients would be invisible until the server rejects a payload.
 */

/**
 * eudrCommon:IdentifierTypeType. Note that IMO-based identifiers (ship_man_comp_imo,
 * ship_reg_owner_imo), remos, TRACES number and NIRMS number exist in the V1/V2 schemas
 * but were removed for V3 (confirmed by release 8.2.1).
 */
const IDENTIFIER_TYPES = [
  'eori',
  'vat',
  'gln',
  'tin',
  'cbr',
  'cin',
  'duns',
  'comp_num',
  'comp_reg',
  'oni'
];

/** eudrCommon:EconomicOperatorIdentificationType/operatorReferenceNumber maxOccurs. */
const MAX_OPERATOR_REFERENCE_NUMBERS = 12;

/** DueDiligenceStatementBaseType/groupedDeclarations and its SD counterpart, maxOccurs. */
const MAX_GROUPED_DECLARATIONS = 2000;

module.exports = {
  IDENTIFIER_TYPES,
  MAX_OPERATOR_REFERENCE_NUMBERS,
  MAX_GROUPED_DECLARATIONS
};
