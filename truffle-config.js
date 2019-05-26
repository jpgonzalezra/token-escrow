const path = require("path");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    coverage: {
        host: 'localhost',
        network_id: '*', // eslint-disable-line camelcase
        port: 8545,
        gas: 0xfffffffffff,
        gasPrice: 0x01,
    },
    development: {
        host: 'localhost',
        port: 8545,
        network_id: '*', // eslint-disable-line camelcase
    },
  },
  compilers: {
      solc: {
          version: '0.5.2',
          docker: false,
          settings: {
              optimizer: {
                  enabled: true,
                  runs: 200,
              },
              evmVersion: 'constantinople',
          },
      },
  }
};