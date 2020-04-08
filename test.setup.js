// This file contains things that must happen before the app is imported (ie. things that happen on import)
/* eslint-disable max-len */
process.env.MACAROON_FILE = './test/fixtures/lnd/admin.macaroon';
process.env.TLS_FILE = './test/fixtures/lnd/tls.cert';
process.env.RPC_USER = 'test-user';
process.env.RPC_PASSWORD = 'test-pass';
process.env.JWT_PUBLIC_KEY = '2d2d2d2d2d424547494e205055424c4943204b45592d2d2d2d2d0a4d4677774451594a4b6f5a496876634e41514542425141445377417753414a42414a6949444e682b6770544f3937627135574748657476323267465a47736f4a0a6e6b54665058774335726a61674b4d56455a4a4a47584e6d51544e7441596e53615a31754a6e692f48356b4b32594e614a333933326730434177454141513d3d0a2d2d2d2d2d454e44205055424c4943204b45592d2d2d2d2d';

const sinon = require('sinon');
global.Lightning = sinon.stub();
global.WalletUnlocker = sinon.stub();
sinon.stub(require('grpc'), 'load').returns({lnrpc: {
  Lightning: global.Lightning,
  WalletUnlocker: global.WalletUnlocker
}});
