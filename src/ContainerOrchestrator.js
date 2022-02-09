const Docker = require('dockerode');
const fs = require("fs");
const {execSync} = require("child_process");
const POSTGRES_CONTAINER_EXPECTED_NAME = "/hedera-postgres";
const SERVICES_NODE_CONTAINER_EXPECTED_NAME = '/services-node';
module.exports = new ContainerOrchestrator();

class ContainerOrchestrator {

	constructor() {
		this.isPostgresStarted = false;
		this.isHederaNodeStarted = false;
		// TODO: this path
		this.isHederaNodeImagePresent = false;
		this.docker = new Docker();
		this.config = {};
		this.getNodeEnvironment();
	}

	/**
	 * Detects active environment in the current machine - whether there is an active hedera node,
	 * or a postgres database suitable for the node
	 *
	 * @returns {Promise<void>}
	 */
	async detectEnvironment() {
		const services = await this.docker.listContainers({});
		this.isPostgresStarted = services.filter(e => e.Names.includes(POSTGRES_CONTAINER_EXPECTED_NAME)).length === 1;
		this.isHederaNodeStarted = services.filter(e => e.Names.includes(SERVICES_NODE_CONTAINER_EXPECTED_NAME)).length === 1;
	}

	async init() {
		if (!this.isHederaNodeImagePresent) {
			await this.pullServicesNode();
		}
		if (!this.isPostgresStarted) {
			await this.runPostgres();
		}
		if (!this.isHederaNodeStarted) {
			await this.runServicesNode();
		}
	}

	/**
	 * Gets the hedera node environment from a .env file in the local hedera project.
	 * TODO: refactor in order for it to fetch the TAG of the image from another source.
	 */
	getNodeEnvironment() {
		const envFile = "/home/yoan/Desktop/limechain/hedera-services/.env";
		const data = fs.readFileSync(envFile).toString();
		data.split("\n")
			.map(row => row.split("="))
			.map(splitRow => {
				if (splitRow[0].length > 0 && splitRow[1] !== undefined) {
					this.config[splitRow[0]] = splitRow[1];
				}
			});
	}

	/**
	 * When implemented, should pull the latest image(tag) from the hedera image repository.
	 *
	 * @returns {Promise<void>}
	 */
	async pullServicesNode() {

	}

	/**
	 * Runs a specific version of a hedera node via docker.
	 * @returns {Promise<void>}
	 */
	async runServicesNode() {
		const {execSync, exec} = require('child_process');
		const cmd = "docker run -p 50211:50211 " +
			"  --name " + SERVICES_NODE_CONTAINER_EXPECTED_NAME +
			"  --link hedera-postgres:hedera-postgres " +
			"  -v /home/yoan/WebstormProjects/HardhatPluginBoilerplate/node-config:/opt/hedera/services/config-mount " +
			"  -v /home/yoan/WebstormProjects/HardhatPluginBoilerplate/node-data/node2/saved:/opt/hedera/services/data/saved " +
			"  -v /home/yoan/WebstormProjects/HardhatPluginBoilerplate/node-data/node2/output:/opt/hedera/services/output  services-node:" + this.config.TAG;
		execSync(cmd);
		this.isHederaNodeStarted = true;
	}

	/**
	 * Runs a postgres container, suitable for a hedera node.
	 * @returns {Promise<void>}
	 */
	async runPostgres() {
		const cmd = "docker run --name " + POSTGRES_CONTAINER_EXPECTED_NAME + " -d -p 5432:5432 " +
			"--env POSTGRES_PASSWORD=password --env POSTGRES_USER=swirlds " +
			"--env POSTGRES_DB=fcfs " +
			"--env PGDATA=/var/lib/postgresql/data/pgdata " +
			"postgres:10.15-alpine";
		execSync(cmd);
		this.isPostgresStarted = true;
	}
}
