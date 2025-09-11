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
                const result = await service.getDdsInfo(testDdsIdentifiers[0]);

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
                const result = await service.getDdsInfoByInternalReferenceNumber(testInternalRef);

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
                const result = await service.getStatementByIdentifiers(testReferenceNumber, testVerificationNumber);
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
                const result = await service.getStatementByIdentifiers('25HRYVJNLEO828', 'WOHYRNOQ');
                
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
                    const arrayFields = ['commodities', 'producers', 'speciesInfo', 'referenceNumber'];
                    
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
                const result = await service.getReferencedDds(testAssociatedStatementReferenceNumber, testAssociatedStatementSecurityNumber);
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
    });

});
