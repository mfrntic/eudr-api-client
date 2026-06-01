/**
 * Unit tests for EudrRetrievalClientV3 facade.
 */

const { expect } = require('chai');
const EudrRetrievalClientV3 = require('../../services/retrieval-service-v3');

describe('EudrRetrievalClientV3', function() {
  const baseConfig = {
    username: 'testuser',
    password: 'testpass',
    webServiceClientId: 'eudr-repository'
  };

  it('should initialize with automatic endpoint generation', function() {
    const client = new EudrRetrievalClientV3(baseConfig);

    expect(client.config.endpoint).to.equal('https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRDueDiligenceStatementServiceV3');
    expect(client.config.webServiceClientId).to.equal('eudr-repository');
  });

  it('should expose retrieval methods', function() {
    const client = new EudrRetrievalClientV3(baseConfig);

    expect(client.getDds).to.be.a('function');
    expect(client.getDdsByInternalReference).to.be.a('function');
    expect(client.getDdsByIdentifiers).to.be.a('function');
  });

  it('should delegate getDds to transport and preserve error contract', async function() {
    const client = new EudrRetrievalClientV3(baseConfig);

    try {
      await client.getDds('uuid');
      throw new Error('Expected getDds to throw');
    } catch (error) {
      expect(error.message).to.equal('getDds is not implemented yet. Planned in Story 4.');
    }
  });

  it('should delegate getDdsByInternalReference to transport and preserve error contract', async function() {
    const client = new EudrRetrievalClientV3(baseConfig);

    try {
      await client.getDdsByInternalReference('INT-REF');
      throw new Error('Expected getDdsByInternalReference to throw');
    } catch (error) {
      expect(error.message).to.equal('getDdsByInternalReference is not implemented yet. Planned in Story 4.');
    }
  });

  it('should delegate getDdsByIdentifiers to transport and preserve error contract', async function() {
    const client = new EudrRetrievalClientV3(baseConfig);

    try {
      await client.getDdsByIdentifiers('REF', 'VERIF');
      throw new Error('Expected getDdsByIdentifiers to throw');
    } catch (error) {
      expect(error.message).to.equal('getDdsByIdentifiers is not implemented yet. Planned in Story 4.');
    }
  });
});
