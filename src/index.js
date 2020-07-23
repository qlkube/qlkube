const fs = require("fs").promises;
const express = require('express');
const compression = require('compression');
const {createSchema} = require('./schema');
const getOpenApiSpec = require('./oas');
const { graphqlHTTP } = require('express-graphql');
const logger = require('pino')({useLevelLabels: true});

main().catch(e => logger.error({error: e.stack}, "failed to start qlkube server"));

async function main() {
    const inCluster = process.env.IN_CLUSTER !== 'false';
    logger.info({inCluster}, "cluster mode configured");
    const kubeApiUrl = inCluster ? 'https://kubernetes.default.svc' : process.env.KUBERNETES_HOST;
    const token = inCluster ? await fs.readFile('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8') : process.env.KUBE_SCHEMA_TOKEN;

    const oas = await getOpenApiSpec(kubeApiUrl, token);

    useJWTauth = true;
    let schema = null;
    if (useJWTauth) {
        schema = await createSchema(oas, kubeApiUrl);
    } else {
        schema = await createSchema(oas, kubeApiUrl, token);
    } 

    // server schema:
    const app = express()
    app.use(
        '/graphql',
        graphqlHTTP({
        schema,
        graphiql: true
        })
    )

    app.use(compression({ filter: shouldCompress }))
    function shouldCompress (req, res) {
        if (req.headers['x-no-compression']) {
            // don't compress responses with this request header
            return false
        }
        // fallback to standard filter function
        return compression.filter(req, res)
    }
    app.listen(process.env.LISTEN_PORT || 49020)
}
