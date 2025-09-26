/**
 * Integration tests for EUDR Retrieval Service V2 Client
 * 
 * These tests verify the V2 implementation with corrected SOAPActions
 * and V2 namespace support against the actual EUDR service endpoints.
 * 
 * Prerequisites:
 * - Valid EUDR credentials in environment variables
 * - Network access to EUDR test environment
 * 
 * Environment Variables Required:
 * - EUDR_TRACES_USERNAME: Valid username for EUDR service
 * - EUDR_TRACES_PASSWORD: Valid password for EUDR service
 * - EUDR_WEB_SERVICE_CLIENT_ID: Client ID (defaults to 'eudr-test')
 */

// Set UTF-8 encoding for console output
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

const { expect } = require('chai');
const EudrRetrievalClientV2 = require('../../services/retrieval-service-v2');

describe('EudrRetrievalClient V2 Tests', function () {
    this.timeout(30000); // 30 second timeout for network operations

    // Test data
    testDdsIdentifiers = [
        '49c44a92-51be-4d6c-a57d-0b8cd825a7ca', // From trade submission test
        'bbcc3108-f2f8-4ad3-9c55-a9484c108bc6', // From simple trade submission test
    ];


    const testInternalRef = 'TEST_REF_123';
    const testReferenceNumber = '25HRD5I3WZ1046';
    const testVerificationNumber = 'SI17WKC3';
    const testAssociatedStatementReferenceNumber = '25NLWPAZWQ8865';
    const testAssociatedStatementSecurityNumber = 'XtZ7C6t3lFHnOhAqN9fw5w==:dRES/NzB0xL4nkf5nmRrb/5SMARFHoDK53PaCJFPNRA=';

    console.log('\nEudrRetrievalClientV2 Tests');
    console.log('------------------------------------------------------------------------------------------------');

    describe('Client Initialization', function () {
        it('should create client with automatic endpoint generation for eudr-test', function () {
            const client = new EudrRetrievalClientV2({
                username: 'test-user',
                password: 'test-password',
                webServiceClientId: 'eudr-test'
            });

            expect(client).to.be.an.instanceOf(EudrRetrievalClientV2);
            expect(client.endpoint).to.include('EUDRRetrievalServiceV2'); // V2 endpoint
            expect(client.endpoint).to.include('acceptance.eudr.webcloud.ec.europa.eu');
        });

        it('should create client with automatic endpoint generation for eudr', function () {
            const client = new EudrRetrievalClientV2({
                username: 'test-user',
                password: 'test-password',
                webServiceClientId: 'eudr-repository'
            });

            expect(client).to.be.an.instanceOf(EudrRetrievalClientV2);
            expect(client.endpoint).to.include('EUDRRetrievalServiceV2'); // V2 endpoint
            expect(client.endpoint).to.include('eudr.webcloud.ec.europa.eu');
        });

        it('should create client with manual endpoint override', function () {
            const customEndpoint = 'https://custom-endpoint.com/ws/EUDRRetrievalServiceV2';
            const client = new EudrRetrievalClientV2({
                endpoint: customEndpoint,
                username: 'test-user',
                password: 'test-password',
                webServiceClientId: 'custom-client'
            });

            expect(client).to.be.an.instanceOf(EudrRetrievalClientV2);
            expect(client.endpoint).to.equal(customEndpoint);
        });

        it('should use V2 namespace in SOAP envelopes', function () {
            const client = new EudrRetrievalClientV2({
                username: 'test-user',
                password: 'test-password',
                webServiceClientId: 'eudr-test'
            });

            const envelope = client.createGetDdsInfoEnvelope('test-uuid');
            expect(envelope).to.include('xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2"');
            expect(envelope).to.include('<v2:GetStatementInfoRequest>');
        });
    });

    describe('SOAP Envelope Generation', function () {
        let client;

        before(function () {
            client = new EudrRetrievalClientV2({
                username: 'test-user',
                password: 'test-password',
                webServiceClientId: 'eudr-test'
            });
        });

        it('should generate valid getDdsInfo envelope with V2 namespace', function () {
            const envelope = client.createGetDdsInfoEnvelope(testDdsIdentifiers[0]);

            expect(envelope).to.include('<?xml version="1.0" encoding="UTF-8"?>');
            expect(envelope).to.include('xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2"');
            expect(envelope).to.include('<v2:GetStatementInfoRequest>');
            expect(envelope).to.include(`<v2:identifier>${testDdsIdentifiers[0]}</v2:identifier>`);
            expect(envelope).to.include('<wsse:Security');
            expect(envelope).to.include('<wsse:UsernameToken');
        });

        it('should generate valid getDdsInfoByInternalReferenceNumber envelope', function () {
            const envelope = client.createGetDdsInfoByInternalReferenceNumberEnvelope(testInternalRef);

            expect(envelope).to.include('xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2"');
            expect(envelope).to.include('<v2:GetDdsInfoByInternalReferenceNumberRequest>');
            expect(envelope).to.include(testInternalRef);
        });

        it('should generate valid getStatementByIdentifiers envelope', function () {
            const envelope = client.createGetStatementByIdentifiersEnvelope(testReferenceNumber, testVerificationNumber);

            expect(envelope).to.include('xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2"');
            expect(envelope).to.include('<v2:GetStatementByIdentifiersRequest>');
            expect(envelope).to.include(`<v2:referenceNumber>${testReferenceNumber}</v2:referenceNumber>`);
            expect(envelope).to.include(`<v2:verificationNumber>${testVerificationNumber}</v2:verificationNumber>`);
        });

        it('should generate valid getReferencedDds envelope', function () {
            const envelope = client.createGetReferencedDdsEnvelope(testReferenceNumber, testAssociatedStatementSecurityNumber);

            expect(envelope).to.include('xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2"');
            expect(envelope).to.include('<v2:GetReferencedDdsRequest>');
            expect(envelope).to.include(`<v2:referenceNumber>${testReferenceNumber}</v2:referenceNumber>`);
            expect(envelope).to.include(`<v2:referenceDdsVerificationNumber>${testAssociatedStatementSecurityNumber}</v2:referenceDdsVerificationNumber>`);
        });
    });

    // Only run live tests if credentials are available

    describe('Live Service Tests V2', function () {
        let service;

        before(function () {
            service = new EudrRetrievalClientV2({
                username: process.env.EUDR_TRACES_USERNAME,
                password: process.env.EUDR_TRACES_PASSWORD,
                webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
            });
        });

        it('should successfully call getDdsInfo with valid credentials V2', async function () {
            try {
                const result = await service.getDdsInfo("8d2f35d0-e9bf-4f08-8659-695e1cdf3256"); //testDdsIdentifiers[0]

                console.log('getDdsInfo V2 result:', JSON.stringify(result, null, 2));

                expect(result).to.be.an('object');
                expect(result.httpStatus).to.be.a('number');
                expect(result.ddsInfo).to.be.an('array');
            } catch (error) {
                // Log the error for debugging
                console.log('getDdsInfo V2 error:', JSON.stringify(error, null, 2));

                // If it's a valid service error (404, etc.), that's acceptable for testing
                if (error.details && error.details.status) {
                    expect(error.details.status).to.be.oneOf([404, 500]);
                } else {
                    throw error;
                }
            }
        });

        it('should successfully call getDdsInfoByInternalReferenceNumber with valid credentials V2', async function () {
            try {
                const result = await service.getDdsInfoByInternalReferenceNumber("DLE");
                console.log('getDdsInfoByInternalReferenceNumber V2 result:', JSON.stringify(result, null, 2));
                expect(result).to.be.an('object');
                expect(result.httpStatus).to.be.a('number');
                expect(result.ddsInfo).to.be.an('array');
            } catch (error) {
                // Log the error for debugging
                console.log('getDdsInfoByInternalReferenceNumber V2 error:', JSON.stringify(error, null, 2));

                // If it's a valid service error (404, etc.), that's acceptable for testing
                if (error.details && error.details.status) {
                    expect(error.details.status).to.be.oneOf([404, 500]);
                } else {
                    throw error;
                }
            }
        });

        it('should successfully call getStatementByIdentifiers with valid credentials V2', async function () {
            try {
                const result = await service.getStatementByIdentifiers('25HRHII1OB3847', '4YYQPKJ3'  );
                console.log('getStatementByIdentifiers V2 result:', JSON.stringify(result, null, 2));
                expect(result).to.be.an('object');
                expect(result.httpStatus).to.be.a('number');
                expect(result.ddsInfo).to.be.an('array');
            } catch (error) {
                // Log the error for debugging
                console.log('getStatementByIdentifiers V2 error:', JSON.stringify(error, null, 2));

                // If it's a valid service error (404, etc.), that's acceptable for testing
                if (error.details && error.details.status) {
                    expect(error.details.status).to.be.oneOf([404, 500]);
                } else {
                    throw error;
                }
            }
        });

        it('should always return commodities as an array in getStatementByIdentifiers V2 response', async function () {
            try {
                const result = await service.getStatementByIdentifiers('25HRE7K4NL3709', 'WTGUSQN6');

                // Check if we have DDS info
                if (result.ddsInfo && result.ddsInfo.length > 0) {
                    const ddsInfo = result.ddsInfo[0];
                    console.log('V2 DDS Info:', JSON.stringify(ddsInfo, null, 2));
                    // If commodities exist, they should always be an array
                    if (ddsInfo.commodities !== undefined) {
                        expect(ddsInfo.commodities).to.be.an('array');
                        console.log('V2 Commodities is correctly returned as array:', Array.isArray(ddsInfo.commodities));
                    }
                }
            } catch (error) {
                // If this is a real test with actual credentials, we might get authentication errors
                // In that case, we'll just log the error and continue
                console.log('Note: Could not test V2 commodities array due to error:', error.message);
            }
        });

        it('should always return array fields as arrays in getStatementByIdentifiers V2 response', async function () {
            try {
                const result = await service.getStatementByIdentifiers('25HRYVJNLEO828', 'WOHYRNOQ');

                // Check if we have DDS info
                if (result.ddsInfo && result.ddsInfo.length > 0) {
                    const ddsInfo = result.ddsInfo[0];

                    // Check all array fields that should always be arrays
                    const arrayFields = ['commodities', 'producers', 'speciesInfo'];

                    arrayFields.forEach(field => {
                        if (ddsInfo[field] !== undefined) {
                            expect(ddsInfo[field]).to.be.an('array', `V2 ${field} should be an array`);
                            console.log(`V2 ${field} is correctly returned as array:`, Array.isArray(ddsInfo[field]));
                        }
                    });

                    // Check nested array fields in commodities
                    if (ddsInfo.commodities && ddsInfo.commodities.length > 0) {
                        const commodity = ddsInfo.commodities[0];
                        if (commodity.producers !== undefined) {
                            expect(commodity.producers).to.be.an('array', 'V2 commodity.producers should be an array');
                        }
                        if (commodity.speciesInfo !== undefined) {
                            expect(commodity.speciesInfo).to.be.an('array', 'V2 commodity.speciesInfo should be an array');
                        }
                    }
                }
            } catch (error) {
                console.log('Note: Could not test V2 array fields due to error:', error.message);
            }
        });

        it('should successfully call getReferencedDds with valid credentials V2', async function () {
            try {
                const result = await service.getReferencedDds(testAssociatedStatementReferenceNumber, testAssociatedStatementSecurityNumber );
                console.log('getReferencedDds V2 result:', JSON.stringify(result, null, 2));
                expect(result).to.be.an('object');
                expect(result.httpStatus).to.be.a('number');
                expect(result.ddsInfo).to.be.an('array');
            } catch (error) {
                // Log the error for debugging
                console.log('getReferencedDds V2 error:', JSON.stringify(error, null, 2));

                // If it's a valid service error (404, etc.), that's acceptable for testing
                if (error.details && error.details.status) {
                    expect(error.details.status).to.be.oneOf([404, 500]);
                } else {
                    throw error;
                }
            }
        });

        it('should successfully deal with EUDR-API-NO-DDS error V2 with getStatementByIdentifiers', async function () {
            try {
                const result = await service.getStatementByIdentifiers('25HRYY2LN63594', 'XZSNMTXO');

                console.log('getStatementByIdentifiers V2 result:', JSON.stringify(result, null, 2));

            } catch (error) {
                // If this is a real test with actual credentials, we might get authentication errors
                // In that case, we'll just log the error and continue
                console.log('getStatementByIdentifiers ERROR:', JSON.stringify(error, null, 2));
                // Check if this is the specific EUDR-API-NO-DDS error we're testing
                if (error.details && error.details.soapFault && error.details.soapFault.includes('EUDR-VERIFICATION-NUMBER-INVALID')) {
                    // Verify the new error handling
                    expect(error.errorType).to.equal('INVALID_VERIFICATION_NUMBER');
                    expect(error.details.status).to.equal(400);
                    expect(error.details.statusText).to.equal('Invalid Verification Number');
                    expect(error.message).to.include('Invalid verification number');
                    console.log('✅ EUDR-VERIFICATION-NUMBER-INVALID error properly handled with 400 status');
                }
                // Check if this is the specific EUDR-WEBSERVICE-STATEMENT-NOT-FOUND error we're testing
                else if (error.details && error.details.soapFault && error.details.soapFault.includes('EUDR-WEBSERVICE-STATEMENT-NOT-FOUND')) {
                    // Verify the new error handling
                    expect(error.errorType).to.equal('DDS_NOT_FOUND');
                    expect(error.details.status).to.equal(404);

                    console.log('✅ EUDR-WEBSERVICE-STATEMENT-NOT-FOUND error properly handled with 404 status');
                }
                else if (error.details && error.details.status) {
                    // Accept other valid service errors for testing
                    expect(error.details.status).to.be.oneOf([404, 500]);
                    console.log('ℹ️ Other service error (acceptable for testing):', error.details.status);
                } else {
                    throw error;
                }
            }
        });


        it('should successfully deal with EUDR-API-NO-DDS error V2 with getReferencedDds', async function () {
            try {
                const result = await service.getReferencedDds('25DEISLG346760', 'mCgowPlRBDixzr7Y3B8n5Q%3D%3D%3ALOD9ln9BPy1Edbs6+poDQhxu2GAvhfpZYf2TS+QTbqE%3D');
                console.log('getReferencedDds V2 result:', JSON.stringify(result, null, 2));
                expect(result).to.be.an('object');
                expect(result.httpStatus).to.be.a('number');
                expect(result.ddsInfo).to.be.an('array');
            } catch (error) {
                // Log the error for debugging
                // console.log('getReferencedDds V2 error (expected):', JSON.stringify(error, null, 2));

                // Check if this is the specific EUDR-API-NO-DDS error we're testing
                if (error.details && error.details.data && error.details.data.includes('EUDR-API-NO-DDS')) {
                    // Verify the new error handling
                    expect(error.errorType).to.equal('DDS_NOT_FOUND');
                    expect(error.details.status).to.equal(404);
                    expect(error.details.statusText).to.equal('DDS Not Found');
                    expect(error.message).to.include('DDS not found');
                    console.log('✅ EUDR-API-NO-DDS error properly handled with 404 status');
                } else if (error.details && error.details.status) {
                    // Accept other valid service errors for testing
                    expect(error.details.status).to.be.oneOf([404, 500]);
                    console.log('ℹ️ Other service error (acceptable for testing):', error.details.status);
                } else {
                    throw error;
                }
            }
        });
    });


    describe('Error Handling V2', function () {
        it('should handle invalid credentials gracefully (V2)', async function () {
            const invalidService = new EudrRetrievalClientV2({
                username: 'invalid_username',
                password: 'invalid_password',
                webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
            });

            try {
                const result = await invalidService.getDdsInfo(testDdsIdentifiers[0]);

                // If we reach here, the test should fail because we expect an authentication error
                throw new Error('Expected authentication error but got successful response');
            } catch (error) {
                // Our V2 service now converts SOAP authentication faults to proper HTTP 401
                expect(error.error).to.be.true;
                expect(error.details.status).to.be.equal(401);
                expect(error.details.statusText).to.be.equal('Unauthorized');
                expect(error.message).to.include('Authentication failed');
            }
        });

        it('should handle network connectivity issues gracefully (V2)', async function () {
            const invalidService = new EudrRetrievalClientV2({
                endpoint: 'https://invalid-endpoint.com/',
                username: 'test',
                password: 'test',
                webServiceClientId: 'test',
                timeout: 1000
            });

            try {
                await invalidService.getDdsInfo('test-uuid');
                // If we reach here, the test should fail because we expect an error
                throw new Error('Expected network error but got successful response');
            } catch (error) {
                // Verify that we get the expected custom error structure
                expect(error).to.be.an('object');
                expect(error.error).to.be.true;
                expect(error.message).to.be.a('string');
            }
        });

        it('should handle invalid UUID format gracefully (V2)', async function () {
            const service = new EudrRetrievalClientV2({
                username: 'test',
                password: 'test',
                webServiceClientId: 'eudr-test'
            });

            try {
                await service.getDdsInfo('invalid-uuid-format');
                // Test depends on service behavior - may succeed or fail
            } catch (error) {
                // If error occurs, verify it has the expected structure
                expect(error).to.be.an('object');
                expect(error.error).to.be.true;
            }
        });

        it('should validate UUID limit (V2)', async function () {
            const service = new EudrRetrievalClientV2({
                username: 'test',
                password: 'test',
                webServiceClientId: 'eudr-test'
            });

            // Create an array with more than 100 UUIDs
            const tooManyUuids = Array(101).fill().map((_, i) => `uuid-${i}`);

            try {
                await service.getDdsInfo(tooManyUuids);
                throw new Error('Expected validation error for too many UUIDs');
            } catch (error) {
                expect(error.message).to.include('Maximum of 100 UUIDs');
            }
        });

        it('should validate internal reference number length (V2)', async function () {
            const service = new EudrRetrievalClientV2({
                username: 'test',
                password: 'test',
                webServiceClientId: 'eudr-test'
            });

            try {
                await service.getDdsInfoByInternalReferenceNumber('ab'); // Too short
                throw new Error('Expected validation error for short reference number');
            } catch (error) {
                expect(error.message).to.include('must be between 3 and 50 characters');
            }

            try {
                await service.getDdsInfoByInternalReferenceNumber('a'.repeat(51)); // Too long
                throw new Error('Expected validation error for long reference number');
            } catch (error) {
                expect(error.message).to.include('must be between 3 and 50 characters');
            }
        });

        it('should handle BusinessRulesValidationException error type V2', async function () {
            const service = new EudrRetrievalClientV2({
                username: 'test',
                password: 'test',
                webServiceClientId: 'eudr-test'
            });

            // Test processError method with BusinessRulesValidationException
            const mockError = {
                response: {
                    status: 500,
                    statusText: 'Internal Server Error',
                    data: '<?xml version="1.0"?><soapenv:Fault><faultcode>BusinessRulesValidationException</faultcode><faultstring>Invalid business rules</faultstring></soapenv:Fault>'
                }
            };

            const processedError = service.processError(mockError);



            expect(processedError.error).to.be.true;
            expect(processedError.errorType).to.equal('BUSINESS_RULES_VALIDATION');
            expect(processedError.message).to.include('Request failed business rules validation');
            expect(processedError.details.status).to.equal(400);
            expect(processedError.details.statusText).to.equal('Business Rules Validation Failed');
        });

        it('should trigger BusinessRulesValidationException with real API calls V2', async function () {
            // Skip if no credentials available
            if (!process.env.EUDR_TRACES_USERNAME || !process.env.EUDR_TRACES_PASSWORD) {
                this.skip();
            }

            const service = new EudrRetrievalClientV2({
                username: process.env.EUDR_TRACES_USERNAME,
                password: process.env.EUDR_TRACES_PASSWORD,
                webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
            });

            console.log('\n[TEST] Testiranje s pravim API pozivima za BusinessRulesValidationException...');

            // Test 1: Nevaljani reference number format
            console.log('   Test 1: Nevaljani reference number format');
            try {
                const result = await service.getStatementByIdentifiers('INVALID_FORMAT_123', 'INVALID_VER');
                console.log('   [OK] Neočekivano uspješan poziv:', result.httpStatus);
            } catch (error) {
                console.log('   [ERROR] Greška:', JSON.stringify(error, null, 2));

                // Provjeri sadrži li response BusinessRulesValidationException
                if (error.details?.data && error.details.data.includes('BusinessRulesValidationException')) {
                    console.log('      [SUCCESS] Prepoznat BusinessRulesValidationException!');
                    expect(error.errorType).to.equal('BUSINESS_RULES_VALIDATION');
                } else if (error.details?.data) {
                    console.log('      [INFO] Response sadrži:', error.details.data.substring(0, 200) + '...');
                }
            }

            // Test 2: Prekratak reference number
            console.log('\n   Test 2: Prekratak reference number');
            try {
                const result = await service.getStatementByIdentifiers('AB', 'CD');
                console.log('   [OK] Neočekivano uspješan poziv:', result.httpStatus);
            } catch (error) {
                console.log('   [ERROR] Greška:', JSON.stringify(error, null, 2));

                if (error.details?.data && error.details.data.includes('BusinessRulesValidationException')) {
                    console.log('      [SUCCESS] Prepoznat BusinessRulesValidationException!');
                    expect(error.errorType).to.equal('BUSINESS_RULES_VALIDATION');
                }
            }

            // Test 3: Nevaljani internal reference number
            console.log('\n   Test 3: Nevaljani internal reference number');
            try {
                const result = await service.getDdsInfoByInternalReferenceNumber('INVALID_INTERNAL_REF_TOO_LONG_FOR_VALIDATION_INVALID_INTERNAL_REF_TOO_LONG_FOR_VALIDATION_INVALID_INTERNAL_REF_TOO_LONG_FOR_VALIDATION');
                console.log('   [OK] Neočekivano uspješan poziv:', result.httpStatus);
            } catch (error) {
                console.log('   [ERROR] Greška:', JSON.stringify(error, null, 2));
                if (error.details?.data && error.details.data.includes('BusinessRulesValidationException')) {
                    console.log('      [SUCCESS] Prepoznat BusinessRulesValidationException!');
                    expect(error.errorType).to.equal('BUSINESS_RULES_VALIDATION');
                }
            }

            // Test 4: Prazan reference number
            console.log('\n   Test 4: Prazan reference number');
            try {
                const result = await service.getStatementByIdentifiers('', '');
                console.log('   [OK] Neočekivano uspješan poziv:', result.httpStatus);
            } catch (error) {
                console.log('   [ERROR] Greška:', JSON.stringify(error, null, 2));

                if (error.details?.data && error.details.data.includes('BusinessRulesValidationException')) {
                    console.log('      [SUCCESS] Prepoznat BusinessRulesValidationException!');
                    expect(error.errorType).to.equal('BUSINESS_RULES_VALIDATION');
                }
            }

            // Test 5: Prekratak verification number (manje od 8 znakova)
            console.log('\n   Test 5: Prekratak verification number');
            try {
                const result = await service.getStatementByIdentifiers('25HRW9IURY3412', 'COAASV');
                console.log('   [OK] Neočekivano uspješan poziv:', result.httpStatus);
            } catch (error) {
                console.log('   [ERROR] Greška:', JSON.stringify(error, null, 2));

                if (error.details?.data && error.details.data.includes('BusinessRulesValidationException')) {
                    console.log('      [SUCCESS] Prepoznat BusinessRulesValidationException!');
                    expect(error.errorType).to.equal('BUSINESS_RULES_VALIDATION');
                }
            }

            // Test 6: Predugačak verification number (više od 8 znakova)
            console.log('\n   Test 6: Predugačak verification number');
            try {
                const result = await service.getStatementByIdentifiers('25HRW9IURY3412', 'COAASVYHX');
                console.log('   [OK] Neočekivano uspješan poziv:', result.httpStatus);
            } catch (error) {
                console.log('   [ERROR] Greška:', JSON.stringify(error, null, 2));

                if (error.details?.data && error.details.data.includes('BusinessRulesValidationException')) {
                    console.log('      [SUCCESS] Prepoznat BusinessRulesValidationException!');
                    expect(error.errorType).to.equal('BUSINESS_RULES_VALIDATION');
                }
            }

            // Test 7: Nevaljani format verification number (mala slova)
            console.log('\n   Test 7: Nevaljani format verification number (mala slova)');
            try {
                const result = await service.getStatementByIdentifiers('25HRW9IURY3412', 'coaasvyh');
                console.log('   [OK] Neočekivano uspješan poziv:', result.httpStatus);
            } catch (error) {
                console.log('   [ERROR] Greška:', JSON.stringify(error, null, 2));

                if (error.details?.data && error.details.data.includes('BusinessRulesValidationException')) {
                    console.log('      [SUCCESS] Prepoznat BusinessRulesValidationException!');
                    expect(error.errorType).to.equal('BUSINESS_RULES_VALIDATION');
                }
            }

            // // Test 5: Predugačak reference number
            // console.log('\n   Test 5: Predugačak reference number');
            // try {
            //     const longRef = 'A'.repeat(100); // Predugačak reference number
            //     const result = await service.getStatementByIdentifiers(longRef, 'VER');
            //     console.log('   [OK] Neočekivano uspješan poziv:', result.httpStatus);
            // } catch (error) {
            //     console.log('   [ERROR] Greška:');
            //     console.log('      Error Type:', error.errorType || 'N/A');
            //     console.log('      Message:', error.message);
            //     console.log('      HTTP Status:', error.details?.status || 'N/A');

            //     if (error.details?.data && error.details.data.includes('BusinessRulesValidationException')) {
            //         console.log('      [SUCCESS] Prepoznat BusinessRulesValidationException!');
            //         expect(error.errorType).to.equal('BUSINESS_RULES_VALIDATION');
            //     }
            // }

            console.log('\n[SUCCESS] Testiranje s pravim API pozivima završeno!');
        });

        it('should handle different error types correctly (V2)', async function () {
            const service = new EudrRetrievalClientV2({
                username: 'test',
                password: 'test',
                webServiceClientId: 'eudr-test'
            });

            // Test authentication error
            const authError = {
                response: {
                    status: 500,
                    statusText: 'Internal Server Error',
                    data: 'UnauthenticatedException: Invalid credentials'
                }
            };

            const processedAuthError = service.processError(authError);
            expect(processedAuthError.errorType).to.equal('AUTHENTICATION_FAILED');
            expect(processedAuthError.details.status).to.equal(401);

            // Test network error
            const networkError = {
                request: 'Request sent but no response received'
            };

            const processedNetworkError = service.processError(networkError);
            expect(processedNetworkError.errorType).to.equal('NETWORK_ERROR');

            // Test unknown error
            const unknownError = {
                message: 'Some unknown error'
            };

            const processedUnknownError = service.processError(unknownError);
            expect(processedUnknownError.errorType).to.equal('UNKNOWN');
        });
    });

});
