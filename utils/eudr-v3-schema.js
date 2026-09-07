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

/** commodities maxOccurs — identical in DueDiligenceStatementBaseType and SimplifiedDeclarationBaseType. */
const MAX_COMMODITIES = 200;

/** producers maxOccurs — identical in DdsCommodityType and SdCommodityType. */
const MAX_PRODUCERS = 1000;

/** DdsCommodityType/speciesInfo maxOccurs. SdCommodityType has no speciesInfo. */
const MAX_SPECIES_INFO = 500;

/** SdProducerLocationType/postalAddress maxOccurs. */
const MAX_POSTAL_ADDRESSES = 100;

/** SdProducerLocationType/cadastralIdentifier maxOccurs. */
const MAX_CADASTRAL_IDENTIFIERS = 100;

/**
 * eudrCommon:ReferenceNumberType maxLength. SD types internalReferenceNumber as this
 * 14-character type, while the DDS field and the getSdByInternalReference lookup both use
 * InternalReferenceNumberType (50) — so an SD internal reference is capped at 14 but searched
 * through a 50-character field. The 1.5 reference doc separately claims 35. Three numbers for
 * one field; we follow the type that actually carries it.
 */
const MAX_SD_INTERNAL_REFERENCE_LENGTH = 14;

/**
 * geometryGeojson is xs:base64Binary in both the DDS and SD schemas, but callers naturally
 * hold a GeoJSON object or a Buffer. String(value) would turn those into "[object Object]"
 * or UTF-8 text respectively - well-formed XML carrying the wrong bytes, which only fails
 * at the server. Normalise here so both clients behave the same way.
 *
 * A string is passed through untouched: it is already whatever the caller intended, and
 * re-encoding an existing base64 payload would corrupt it.
 *
 * @param {string|Buffer|Object} value
 * @param {string} fieldPath Used in the error message, e.g. 'producer.producerLocation'.
 * @returns {string} base64
 */
function encodeGeoJsonBase64(value, fieldPath) {
  if (typeof value === 'string') {
    return value;
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  if (value && typeof value === 'object') {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64');
  }

  const error = new Error(
    `${fieldPath}.geometryGeojson must be a base64 string, a Buffer, or a GeoJSON object (received ${typeof value}).`
  );
  error.eudrErrorCode = 'EUDR_V3_GEOJSON_INVALID';
  error.eudrSpecific = true;
  throw error;
}

module.exports = {
  IDENTIFIER_TYPES,
  MAX_OPERATOR_REFERENCE_NUMBERS,
  MAX_GROUPED_DECLARATIONS,
  MAX_COMMODITIES,
  MAX_PRODUCERS,
  MAX_SPECIES_INFO,
  MAX_POSTAL_ADDRESSES,
  MAX_CADASTRAL_IDENTIFIERS,
  MAX_SD_INTERNAL_REFERENCE_LENGTH,
  encodeGeoJsonBase64
};
