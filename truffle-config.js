module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        ganache: {
            host: "localhost",
            port: 7545,
            network_id: "*", // Match any network id
            websockets: true
        },
        chainskills: {
            host: "localhost",
            port: 8545,
            network_id: "4224"
        }
    },
    // Configure your compilers
    compilers: {
        solc: {
            version: '0.5.2',
            settings: {          // See the solidity docs for advice about optimization and evmVersion
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }
    }
};
