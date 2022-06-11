/* eslint-disable camelcase, id-length, max-len */

function randomString(length, chars) {
  let result = '';
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function randomTxId() {
  return randomString(64, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
}

function generateAddress() {
  return '2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg';
}

function getChannelOpen(channelPoint) {

  return {
    active: true,
    remotePubkey: '03311aebc4d9eb8a237d89ae771dec0d1b8a64aa31625c105800fdf5f934d824d2',
    channelPoint: (channelPoint || randomTxId()) + ':0',
    chanId: '440904162803712',
    capacity: '100000',
    localBalance: '40950',
    remoteBalance: '50000',
    commitFee: '9050',
    commitWeight: '724',
    feePerKw: '12500',
    unsettledBalance: '0',
    totalSatoshisSent: '0',
    totalSatoshisReceived: '0',
    numUpdates: '0',
    pendingHtlcs: [],
    csvDelay: 144,
    private: false,
    initiator: true,
    chan_status_flags: 'ChanStatusDefault',
  };
}

function getChannelClosed(channelPoint, closingTxHash) {
  return {
    channelPoint: (channelPoint || randomTxId()) + ':0',
    chanId: '440904162803712',
    chainHash: '000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943',
    closingTxHash: closingTxHash || randomTxId(),
    remotePubkey: '03311aebc4d9eb8a237d89ae771dec0d1b8a64aa31625c105800fdf5f934d824d2',
    capacity: '100000',
    closeHeight: 1564209,
    settledBalance: '99817',
    timeLockedBalance: '0',
    closeType: 'COOPERATIVE_CLOSE',
  };
}

function getChannelBalance() {
  return 42000;
}

function getEstimateFee() {
  return {
    feeSat: '44115',
    feerateSatPerByte: '83',
  };
}

function getFeeReport() {
  return {
    channelFees: [
      {
        channelPoint: '231e0634b9d283200c1f59f5f4be1ba04464130c788ab97ba6ec2f7270e50167:0',
        baseFeeMsat: '1000',
        feePerMil: '1',
        feeRate: 0.000001
      },
      {
        channelPoint: 'd93d83c28a719e1a8689948a87a7025497643757d8cd23746e7af4d2710da09d:1',
        baseFeeMsat: '2000',
        feePerMil: '2',
        feeRate: 0.000002
      },
    ],
    dayFeeSum: '0',
    weekFeeSum: '0',
    monthFeeSum: '0',
  };
}

function getForwardingEvents() {
  return {
    forwardingEvents: [
      {
        timestamp: '1548021945',
        chanIdIn: '614599512239964161',
        chanIdOut: '614438983628095489',
        amtIn: '2',
        amtOut: '1',
        fee: '1'
      }
    ],
    lastOffsetIndex: 1,
  };
}

function getInfo() {
  return {
    identity_pubkey: '036dfd60929cb57836a65daa763ceb36a26f4691c670fca91f9ee8b9bf2b445fb8',
    alias: 'nicks-node',
    num_pending_channels: 0,
    num_active_channels: 0,
    num_peers: 0,
    block_height: 1382511,
    block_hash: '0000000000000068cc4f6dccdd7efeecd718a19217025205515d3b3a898370c6',
    syncedToChain: false,
    testnet: true,
    chains: [
      'bitcoin'
    ],
    uris: ['036dfd60929cb57836a65daa763ceb36a26f4691c670fca91f9ee8b9bf2b445fb8:192.168.0.2:10009'],
    best_header_timestamp: '1533778315',
    version: '0.4.2-beta commit=33a5567a0fef801800cd56267e2b264d32c93173'
  };
}

function getWalletBalance() {
  return {
    totalBalance: '140000',
    confirmedBalance: '140000',
    unconfirmedBalance: '140000'
  };
}

function getManagedChannelsFile() {
  return '{"6efe84b44bc9d184979f2527b73cbf0223a5549a3932e78a1460499166f2639e:0":{"name":"Test Node","purpose":"Much Lightning"}}';
}

function getOpenChannels() {
  return [
    getChannelOpen('a6997a3b054265acb1a05e84f1b49f34e87a4758ea9b629839fe7311a0ac3c94'),
    getChannelOpen('47e615ba7d35b5c7e93a62e9adb84fddc11df43dc0790b7000a0a42be243e210'),
  ];
}

function getPendingChannels() {
  return {
    total_limbo_balance: '0',
    pendingOpenChannels: [
      {
        channel: {
          remoteNodePub: '03a13a469bae4785e27fae24e7664e648cfdb976b97f95c694dea5e55e7d302846',
          channelPoint: 'c0b7045595f4f5c024af22312055497e99ed8b7b62b0c7e181d16382a07ae58b:0',
          capacity: '10000000',
          localBalance: '9999817',
          remoteBalance: '0'
        },
        confirmationHeight: 0,
        commitFee: '183',
        commitWeight: '600',
        feePerKw: '253'
      },
      {
        channel: {
          remoteNodePub: '03a13a469bae4785e27fae24e7664e648cfdb976b97f95c694dea5e55e7d302846',
          channelPoint: 'c1b7045595f4f5c024af22287755b21f65e1ec7fbe11ee0181d16382a07ae58b:0',
          capacity: '10000000',
          localBalance: '9999817',
          remoteBalance: '0'
        },
        confirmationHeight: 0,
        commitFee: '183',
        commitWeight: '600',
        feePerKw: '253'
      }
    ],
    pendingClosingChannels: [],
    pendingForceClosingChannels: [
      {
        channel: {
          remoteNodePub: '03ce542ac3320900154ea33c8dfb0e8faa5e6facd88d5de22b011d135e3f5e906f',
          channelPoint: '76cf2031469c8cd16114dc3dddf72e6fa845e433553bdc11388b7e3b0871b296:0',
          capacity: '100000',
          localBalance: '99817',
          remoteBalance: '0'
        },
        closingTxid: '653c87589da62b5fef18538a62ecce154f94236f158d1148efab98136756ed36',
        limboBalance: '99817',
        maturityHeight: 1564543,
        blocksTilMaturity: 144,
        recoveredBalance: '0',
        pendingHtlcs: [
        ]
      }
    ],
    waitingCloseChannels: []
  };
}

function getOnChainTransaction(txHash) {
  return {
    txHash: txHash || randomTxId(),
    amount: '100000',
    numConfirmations: 21353,
    blockHash: '000000000000030984420cbf3cbbcdfe57f9cf9afa05b3b04ef8267a53f52c43',
    blockHeight: 1542864,
    timeStamp: 1560382362,
    totalFees: 0,
    destAddresses: [
      '2N9Dj2NCZhKZs4QaCHuXk5jYev4CHhQTywW',
      '2MvikCGP9D2hwz7ocRqWdJHnNFmExLn6Hw8'
    ]
  };
}

function getOnChainTransactions() {
  return [
    {
      active: true,
      remotePubKey: '0270685ca81a8e4d4d01beec5781f4cc924684072ae52c507f8ebe9daf0caaab7b',
      channelPoint: '9449c2cba3cb9a94bad58eeff3287755b21f65e1ec7fbe11ee0f485a6bb4094e:0',
      chanId: '1582956994904784896',
      capacity: '10000000',
      localBalance: '9739816',
      remoteBalance: '260000',
      commitFee: '184',
      commitWeight: '724',
      feePerKw: '253',
      unsettledBalance: '0',
      totalSatoshisSent: '260000',
      totalSatoshisReceived: '0',
      numUpdates: '10',
      pendingHtlcs: [
      ],
      csvDelay: 1201,
      private: false
    },
    {
      active: true,
      remotePubKey: '036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9',
      channelPoint: '2786816bc527ec570c6fd249ce85fa4e6bddc70675b6a03f1a4a5eefaaae3663:0',
      chanId: '1582956994904915968',
      capacity: '10000000',
      localBalance: '9999817',
      remoteBalance: '0',
      commitFee: '183',
      commitWeight: '600',
      feePerKw: '253',
      unsettledBalance: '0',
      totalSatoshisSent: '0',
      totalSatoshisReceived: '0',
      numUpdates: '0',
      pendingHtlcs: [
      ],
      csvDelay: 1201,
      private: false
    },
    {
      active: true,
      remotePubKey: '03819ddbe246214d4c57b7ea4d28bfe5c09c03bb4308b40c26f1468532131e0cc0',
      channelPoint: 'bea04831d2f479de97a08cd12af688e930eadf2e470e7e6c1719cdf4d5982114:0',
      chanId: '1582956994904719360',
      capacity: '10000000',
      localBalance: '9999817',
      remoteBalance: '0',
      commitFee: '183',
      commitWeight: '600',
      feePerKw: '253',
      unsettledBalance: '0',
      totalSatoshisSent: '0',
      totalSatoshisReceived: '0',
      numUpdates: '0',
      pendingHtlcs: [
      ],
      csvDelay: 1201,
      private: false
    },
    {
      active: true,
      remotePubKey: '03adf1a17ab83438f23bc6c3b87ed8664757923988d5907c469840ddba1a7d1415',
      channelPoint: 'da6d80297ec79cf115140c4272a4e07b9c275bdd0692b85b3167c58b8c556328:0',
      chanId: '1582956994904850432',
      capacity: '10000000',
      localBalance: '9999817',
      remoteBalance: '0',
      commitFee: '183',
      commitWeight: '600',
      feePerKw: '253',
      unsettledBalance: '0',
      totalSatoshisSent: '0',
      totalSatoshisReceived: '0',
      numUpdates: '0',
      pendingHtlcs: [
      ],
      csvDelay: 1201,
      private: false
    },
    {
      active: false,
      remotePubKey: '03c856d2dbec7454c48f311031f06bb99e3ca1ab15a9b9b35de14e139aa663b463',
      channelPoint: '12d3f818e82f448f780539c3b51616c23bc739f2b18bb8f6838200b111230d0e:0',
      chanId: '1583392401509449728',
      capacity: '3999000',
      localBalance: '2000000',
      remoteBalance: '1998817',
      commitFee: '183',
      commitWeight: '724',
      feePerKw: '253',
      unsettledBalance: '0',
      totalSatoshisSent: '0',
      totalSatoshisReceived: '0',
      numUpdates: '0',
      pendingHtlcs: [
      ],
      csvDelay: 480,
      private: false
    },
    {
      active: true,
      remotePubKey: '03c856d2dbec7454c48f311031f06bb99e3ca1ab15a9b9b35de14e139aa663b463',
      channelPoint: '6efe84b44bc9d184979f2527b73cbf0223a5549a3932e78a1460499166f2639e:0',
      chanId: '1582997676835799040',
      capacity: '15000000',
      localBalance: '14259822',
      remoteBalance: '739994',
      commitFee: '184',
      commitWeight: '724',
      feePerKw: '253',
      unsettledBalance: '0',
      totalSatoshisSent: '1500000',
      totalSatoshisReceived: '760005',
      numUpdates: '16',
      pendingHtlcs: [
      ],
      csvDelay: 1802,
      private: false
    },
    {
      active: true,
      remotePubKey: '03c856d2dbec7454c48f311031f06bb99e3ca1ab15a9b9b35de14e139aa663b463',
      channelPoint: 'c1b7045595f4f5c024af22287755b21f65e1ec7fbe11ee0181d16382a07ae58b:0',
      chanId: '1582997676835799040',
      capacity: '15000000',
      localBalance: '14259822',
      remoteBalance: '739994',
      commitFee: '184',
      commitWeight: '724',
      feePerKw: '253',
      unsettledBalance: '0',
      totalSatoshisSent: '1500000',
      totalSatoshisReceived: '760005',
      numUpdates: '16',
      pendingHtlcs: [
      ],
      csvDelay: 1802,
      private: false
    }
  ];
}

function getUnspectUtxos() {
  return {
    utxos: [
      {
        address_type: 0,
        address: 'bc1qp6dxazrsju834sucudvcxy6t3tem3henkf9dfe',
        amountSat: 50000,
        pk_script: '00140e9a6e8870970f1ac398e35983134b8af3b8df33',
        outpoint: '75d342c126473f2bc26c23111b4cc4f8712532a0387d9bb70156d7efc8528efd:1',
        confirmations: 51
      },
      {
        address_type: 0,
        address: 'bc1qp6dxazrsju834sucudvcxy6t3tem3henkf9dfe',
        amountSat: 30000,
        pk_script: '00140e9a6e8870970f1ac398e35983134b8af3b8df33',
        outpoint: '75d342c126473f2bc26c23111b4cc4f8712532a0387d9bb70156d7efc8528efd:1',
        confirmations: 3307
      },
      {
        address_type: 0,
        address: 'bc1qp6dxazrsju834sucudvcxy6t3tem3henkf9dfe',
        amountSat: 20000,
        pk_script: '00140e9a6e8870970f1ac398e35983134b8af3b8df33',
        outpoint: '75d342c126473f2bc26c23111b4cc4f8712532a0387d9bb70156d7efc8528efd:1',
        confirmations: 3996
      },
      {
        address_type: 0,
        address: 'bc1qp6dxazrsju834sucudvcxy6t3tem3henkf9dfe',
        amountSat: 20000,
        pk_script: '00140e9a6e8870970f1ac398e35983134b8af3b8df33',
        outpoint: '75d342c126473f2bc26c23111b4cc4f8712532a0387d9bb70156d7efc8528efd:1',
        confirmations: 26309
      },
      {
        address_type: 1,
        address: '2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg',
        amountSat: 20000,
        pk_script: '00140e9a6e8870970f1ac398e35983134b8af3b8df33',
        outpoint: '75d342c126473f2bc26c23111b4cc4f8712532a0387d9bb70156d7efc8528efd:1',
        confirmations: 27335
      }
    ]
  };
}

module.exports = {
  generateAddress,
  getChannelOpen,
  getChannelClosed,
  getChannelBalance,
  getEstimateFee,
  getFeeReport,
  getForwardingEvents,
  getInfo,
  getWalletBalance,
  getOpenChannels,
  getOnChainTransaction,
  getOnChainTransactions,
  getPendingChannels,
  getManagedChannelsFile,
  getUnspectUtxos,
};
