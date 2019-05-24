const {GraphQLString, GraphQLSchema, GraphQLObjectType, GraphQLBoolean} = require('graphql');
const {mergeSchemas} = require('graphql-tools');
const {createGraphQlSchema} = require('oasgraph');

exports.createSchema = async (oas, kubeApiUrl, token) => {
    let baseSchema = await oasToGraphQlSchema(oas, kubeApiUrl, token)
    return decorateSchema(baseSchema)
};

async function oasToGraphQlSchema(oas, kubeApiUrl, token) {
    const {schema} = await createGraphQlSchema(oas, {
        baseUrl: kubeApiUrl,
        viewer: false,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return schema
}

// adds an 'all' type to the schema
function decorateSchema(baseSchema) {
    //TODO: extract type names to env vars
    const allType = new GraphQLObjectType({
        name: 'all',
        description: 'All kube resources.',
        fields: {
            services: createType({name: "services", allNamespaceQueryName: "listCoreV1ServiceForAllNamespaces", namespacedQueryName: "ioK8sApiCoreV1ServiceList", baseSchema}),
            deployments: createType({name: "deployments", allNamespaceQueryName: "ioK8sApiAppsV1DeploymentList", namespacedQueryName: "listAppsV1NamespacedDeployment", baseSchema}),
            pods: createType({name: "pods", allNamespaceQueryName: "listCoreV1PodForAllNamespaces", namespacedQueryName: "ioK8sApiCoreV1PodList", baseSchema}),
            daemonSets: createType({name: "daemonSets", allNamespaceQueryName: "ioK8sApiAppsV1DaemonSetList", namespacedQueryName: "listAppsV1NamespacedDaemonSet", baseSchema}),
            replicaSets: createType({name: "replicaSets", allNamespaceQueryName: "listAppsV1ReplicaSetForAllNamespaces", namespacedQueryName: "ioK8sApiAppsV1ReplicaSetList", baseSchema}),
            statefulSets: createType({name: "statefulSets", allNamespaceQueryName: "listAppsV1StatefulSetForAllNamespaces", namespacedQueryName: "ioK8sApiAppsV1StatefulSetList", baseSchema}),
            jobs: createType({name: "jobs", allNamespaceQueryName: "ioK8sApiBatchV1JobList", namespacedQueryName: "listBatchV1NamespacedJob", baseSchema}),
            cronJobs: createType({name: "cronJobs", allNamespaceQueryName: "ioK8sApiBatchV1beta1CronJobList", namespacedQueryName: "listBatchV1beta1NamespacedCronJob", baseSchema})
        }
    });

    const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
            name: 'query',
            fields: {
                all: {
                    type: allType,
                    args: {
                        fieldSelector: {type: GraphQLString},
                        includeUninitialized: {type: GraphQLBoolean},
                        namespace: {type: GraphQLString},
                        labelSelector: {type: GraphQLString}
                    },
                    resolve(_, args) {
                        return args // pass above args down to child resolvers as 'parent' object (args fields won't be accessible in served object)
                    }
                }
            }
        })
    });

    const schemas = [baseSchema, schema];
    return mergeSchemas({schemas});
}

function createType({name, allNamespaceQueryName, namespacedQueryName, baseSchema}) {
    const allNamespacesQueryType = baseSchema.getQueryType().getFields()[allNamespaceQueryName];
    const namespacedQueryType = baseSchema.getQueryType().getFields()[namespacedQueryName];
    return {
        type: allNamespacesQueryType.type,
        description: `All ${name} in all namespaces.`,
        resolve(parent, args, context, info) {
            return parent.namespace ?
                allNamespacesQueryType.resolve(parent, parent, context, info) : // 'parent' in this case is just the args passed to the 'all' parent, which is what we want to use as args here
                namespacedQueryType.resolve(parent, parent, context, info);
        }
    }
}

// TODO: all by namespace
// TODO: all by label

