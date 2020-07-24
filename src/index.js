const fs = require("fs").promises;
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const compression = require('compression');
const {createSchema} = require('./schema');
const getOpenApiSpec = require('./oas');
const { printSchema } = require('graphql');
const logger = require('pino')({useLevelLabels: true});

main().catch(e => logger.error({error: e.stack}, "failed to start qlkube server"));

async function main() {
    var environment = process.env.NODE_ENV;

    const inCluster = process.env.IN_CLUSTER !== 'false';
    logger.info({inCluster}, "cluster mode configured");
    const kubeApiUrl = inCluster ? 'https://kubernetes.default.svc' : process.env.KUBERNETES_HOST;
    const token = inCluster ? await fs.readFile('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8') : process.env.KUBE_SCHEMA_TOKEN;


    const oas = await getOpenApiSpec(kubeApiUrl, token);

    useJWTauth = process.env.USE_JWT_AUTH !== 'false';
    let schema = null;
    let server = null;
    if (useJWTauth) {
        logger.info("Generating GraphQL schema to use user JWT from context...")
        schema = await createSchema(oas, kubeApiUrl);
        server = new ApolloServer({
            schema,
            context: ({ req }) => {
                if(req.headers.authorization.length > 0) {
                    const strs = req.headers.authorization.split(' ');
                    var user = {};
                    user.token = strs[0];
                    return user;
                }
            }
        });
    } else {
        logger.warn("Generating GraphQL schema to use default serviceaccount token...")
        schema = await createSchema(oas, kubeApiUrl, token);
        server = new ApolloServer({schema});
    } 

    const app = express();
    app.use(compression());
    app.get('/schema', (req, res) => {
        res.setHeader('content-type', 'text/plain');
        res.send(printSchema(schema))
    });
    app.get('/health', (req, res) => {
        res.setHeader('content-type', 'application/json');
        res.json({ healthy: true })
    });
    server.applyMiddleware({
        app,
        path: '/'
    });
    app.listen({ port: 49020 }, () =>
        logger.info({url: `http://localhost:49020${server.graphqlPath}`}, '🚀 Server ready')
    );
}
