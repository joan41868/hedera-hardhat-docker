const {extendEnvironment, task} = require("hardhat/config");
const {subtask} = require("hardhat/src/internal/core/config/config-env");

extendEnvironment((hre) => {
});

task("hedera-node-network", async (args, hre) => {
	const orchestrator = require('./src/ContainerOrchestrator.js');
	await orchestrator.detectEnvironment();
	await orchestrator.init();
});

// TODO: pull image on npm install
// subtask("hedera-node-network-setup")
// subtask("hedera-node-network-destroy")

module.exports = {};
