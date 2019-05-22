const fs = require("fs").promises;
const {ApolloServer} = require('apollo-server');
const {createSchema} = require('./schema');
const getOpenApiSpec = require('./oas');
const logger = require('pino')({useLevelLabels: true});

main().catch(e => logger.error({error: e.stack}, "failed to start qlkube server"));

async function main() {
    const inCluster = process.env.IN_CLUSTER !== 'false';
    logger.info({inCluster}, "cluster mode configured");
    const kubeApiUrl = inCluster ? 'https://kubernetes.default.svc' : 'http://localhost:8001';
    const token = inCluster ? await fs.readFile('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8') : '';

    const oas = await getOpenApiSpec(kubeApiUrl, token);
    const schema = await createSchema(oas, kubeApiUrl, token)

    const server = new ApolloServer({schema});
    const {url} = await server.listen({port: 8080});
    logger.info({url}, '🚀 Server ready')
}


