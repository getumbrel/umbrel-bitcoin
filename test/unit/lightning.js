/* globals reset, requester, expect, assert, Lightning */
/* eslint-disable max-len */

const sinon = require('sinon');
const proxyquire = require('proxyquire');
const lndMocks = require('../mocks/lnd.js');

describe('lightning API', () => {
  let jwt;
  let bitcoindHelp;

  before(async() => {
    reset();

    bitcoindHelp = sinon.stub(require('bitcoind-rpc').prototype, 'help').callsFake(callback => callback(undefined, {}));

    // TODO: expires Dec 1st, 2019
    jwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlciIsImlhdCI6MTU3NTIyNjQxMn0.N06esl2dhN1mFqn-0o4KQmmAaDW9OsHA39calpp_N9B3Ig3aXWgl064XAR9YVK0qwX7zMOnK9UrJ48KUZ-Sb4A';
  });

  after(async() => {
    bitcoindHelp.restore();
  });

  it('should look operational', async() => {

    Lightning.prototype.GetInfo = sinon.stub().callsFake((_, callback) => callback(undefined, {}));

    const status = await requester
      .get('/v1/lnd/info/status')
      .set('authorization', `jwt ${jwt}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;

        return res.body;
      });
    assert.equal(status.operational, true);
    assert.isTrue(bitcoindHelp.called);
    assert.isTrue(Lightning.prototype.GetInfo.called);
  });
});

describe('lightningLogic', function() {

  describe('getChannelBalance', function() {

    it('should return channel balance', function(done) {

      const originalChannelbalance = lndMocks.getChannelBalance();

      const lndServiceStub = {
        'services/lnd.js': {
          getChannelBalance: () => Promise.resolve(originalChannelbalance)
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getChannelBalance().then(function(channelBalance) {
        assert.equal(channelBalance, originalChannelbalance);

        done();
      });
    });

    it('should throw an error', function(done) {

      const lndServiceStub = {
        'services/lnd.js': {
          getChannelBalance: () => Promise.reject(new Error())
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getChannelBalance().catch(function(error) {
        assert.isNotNull(error);

        done();
      });
    });

  });

  describe('generateAddress', function() {

    it('should return a segwit address', function(done) {

      const originalAddress = lndMocks.generateAddress();

      const lndServiceStub = {
        'services/lnd.js': {
          generateAddress: () => Promise.resolve(originalAddress)
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.generateAddress()
        .then(function(address) {
          assert.equal(address, originalAddress);

          done();
        });
    });

    it('should throw an error', function(done) {

      const lndServiceStub = {
        'services/lnd.js': {
          generateAddress: () => Promise.reject(new Error())
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.generateAddress()
        .catch(function(error) {
          assert.isNotNull(error);

          done();
        });
    });
  });

  describe('getChannelCount', function() {

    it('should return channel count', function(done) {

      const originalChannels = lndMocks.getOpenChannels();

      const lndServiceStub = {
        'services/lnd.js': {
          getOpenChannels: () => Promise.resolve(originalChannels)
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getChannelCount()
        .then(function(channelCount) {
          assert.equal(channelCount.count, originalChannels.length);

          done();
        });

    });

    it('should throw an error', function(done) {

      const lndServiceStub = {
        'services/lnd.js': {
          getOpenChannels: () => Promise.reject(new Error())
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getChannelCount()
        .catch(function(error) {
          assert.isNotNull(error);

          done();
        });

    });

  });

  describe('getChannels', function() {
    it('should return a list of channels', function(done) {

      const originalChannelList = lndMocks.getOpenChannels();
      const originalPendingChannelList = lndMocks.getPendingChannels(); // eslint-disable-line id-length
      const originalOnChainTransactions = lndMocks.getOnChainTransactions(); // eslint-disable-line id-length
      const managedChannelsFile = lndMocks.getManagedChannelsFile();

      const lndServiceStub = {
        'services/lnd.js': {
          getOpenChannels: () => Promise.resolve(originalChannelList),
          getPendingChannels: () => Promise.resolve(originalPendingChannelList),
          getOnChainTransactions: () => Promise.resolve(originalOnChainTransactions)
        },
        'services/disk.js': {
          readJsonFile: () => Promise.resolve(managedChannelsFile)
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getChannels()
        .then(function(channels) {
          assert.equal(channels.count, originalChannelList.count);

          done();
        });

    });
  });

  describe('getPublicUris', function() {

    it('should return a list of uris', function(done) {

      const originalGetInfo = lndMocks.getInfo();

      const lndServiceStub = {
        'services/lnd.js': {
          getInfo: () => Promise.resolve(originalGetInfo)
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getPublicUris()
        .then(function(uris) {
          assert.deepEqual(uris, originalGetInfo.uris);

          done();
        });

    });

    it('should throw an error', function(done) {

      const lndServiceStub = {
        'services/lnd.js': {
          getInfo: () => Promise.reject(new Error())
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getPublicUris()
        .catch(function(error) {
          assert.isNotNull(error);

          done();
        });

    });

  });

  describe('getSyncStatus', function() {

    it('should return the sync status', function(done) {
      const originalGetInfo = {
        synchedToChain: false,
        testnet: false,
        bestHeaderTimestamp: 1535905615,
        blockHeight: 1408630
      };

      const lndServiceStub = {
        'services/lnd.js': {
          getInfo: () => Promise.resolve(originalGetInfo)
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getSyncStatus()
        .then(function(status) {
          assert.property(status, 'percent');
          assert.property(status, 'knownBlockCount');
          assert.property(status, 'processedBlocks');
          assert.notEqual(status.percent, -1);
          assert.notEqual(status.processedBlocks, -1);
          done();
        });

    });

    it('should return -1 if calculation is greater than 100%', function(done) {
      const invaildInfoData = {
        synchedToChain: false,
        testnet: false,
        bestHeaderTimestamp: 1845905615,
        blockHeight: 1408630
      };

      const lndServiceStub = {
        'services/lnd.js': {
          getInfo: () => Promise.resolve(invaildInfoData)
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getSyncStatus()
        .then(function(status) {
          assert.property(status, 'percent');
          assert.property(status, 'knownBlockCount');
          assert.property(status, 'processedBlocks');
          assert.equal(status.percent, -1);
          assert.equal(status.processedBlocks, -1);
          done();
        });

    });

    it('should thrown an error', function(done) {

      const lndServiceStub = {
        'services/lnd.js': {
          getInfo: () => Promise.reject(new Error())
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getSyncStatus()
        .catch(function(error) {
          assert.isNotNull(error);

          done();
        });

    });
  });

  describe('getWalletBalance', function() {

    it('should return a wallet balance', function(done) {

      const originalWalletBalance = lndMocks.getWalletBalance();

      const lndServiceStub = {
        'services/lnd.js': {
          getWalletBalance: () => Promise.resolve(originalWalletBalance)
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getWalletBalance()
        .then(function(walletBalance) {
          assert.deepEqual(walletBalance, originalWalletBalance);

          done();
        });

    });

    it('should throw an error', function(done) {

      const lndServiceStub = {
        'services/lnd.js': {
          getWalletBalance: () => Promise.reject(new Error())
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getWalletBalance()
        .catch(function(error) {
          assert.isNotNull(error);

          done();
        });

    });
  });

  describe('getVersion', function() {

    it('should return a version', function(done) {

      const originalGetInfo = lndMocks.getInfo();

      const lndServiceStub = {
        'services/lnd.js': {
          getInfo: () => Promise.resolve(originalGetInfo)
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getVersion()
        .then(function(version) {
          assert.equal(version.version, '0.4.2');

          done();
        });

    });

    it('should throw an error', function(done) {

      const lndServiceStub = {
        'services/lnd.js': {
          getInfo: () => Promise.reject(new Error())
        }
      };

      const lightningLogic = proxyquire('logic/lightning.js', lndServiceStub);

      lightningLogic.getPublicUris()
        .catch(function(error) {
          assert.isNotNull(error);

          done();
        });

    });

  });
});
