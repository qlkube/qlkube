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
    const allSchemas = {
        allServicesSchema: baseSchema.getQueryType().getFields()["listCoreV1ServiceForAllNamespaces"],
        allServicesInNamespaceSchema: baseSchema.getQueryType().getFields()["ioK8sApiCoreV1ServiceList"],

        allDeploysSchema: baseSchema.getQueryType().getFields()["ioK8sApiAppsV1DeploymentList"],
        allDeploysInNamespaceSchema: baseSchema.getQueryType().getFields()["listAppsV1NamespacedDeployment"],

        allPodsSchema: baseSchema.getQueryType().getFields()["listCoreV1PodForAllNamespaces"],
        allPodsInNamespaceSchema: baseSchema.getQueryType().getFields()["ioK8sApiCoreV1PodList"],

        allDaemonSetsSchema: baseSchema.getQueryType().getFields()["ioK8sApiAppsV1DaemonSetList"],
        allDaemonSetsInNamespaceSchema: baseSchema.getQueryType().getFields()["listAppsV1NamespacedDaemonSet"],

        allReplicaSetsSchema: baseSchema.getQueryType().getFields()["listAppsV1ReplicaSetForAllNamespaces"],
        allReplicaSetsInNamespaceSchema: baseSchema.getQueryType().getFields()["ioK8sApiAppsV1ReplicaSetList"],

        allStatefulSetsSchema: baseSchema.getQueryType().getFields()["listAppsV1StatefulSetForAllNamespaces"],
        allStatefulSetsInNamespaceSchema: baseSchema.getQueryType().getFields()["ioK8sApiAppsV1StatefulSetList"],

        allJobsSchema: baseSchema.getQueryType().getFields()["ioK8sApiBatchV1JobList"],
        allJobsInNamespaceSchema: baseSchema.getQueryType().getFields()["listBatchV1NamespacedJob"],

        allCronJobsSchema: baseSchema.getQueryType().getFields()["ioK8sApiBatchV1beta1CronJobList"],
        allCronJobsInNamespaceSchema: baseSchema.getQueryType().getFields()["listBatchV1beta1NamespacedCronJob"],
    };

    const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
            name: 'query',
            fields: {
                all: {
                    type: allType(allSchemas),
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

const allType = ({
                     allServicesSchema,
                     allServicesInNamespaceSchema,
                     allDeploysSchema,
                     allDeploysInNamespaceSchema,
                     allPodsSchema,
                     allPodsInNamespaceSchema,
                     allDaemonSetsSchema,
                     allDaemonSetsInNamespaceSchema,
                     allReplicaSetsSchema,
                     allReplicaSetsInNamespaceSchema,
                     allStatefulSetsSchema,
                     allStatefulSetsInNamespaceSchema,
                     allJobsSchema,
                     allJobsInNamespaceSchema,
                     allCronJobsSchema,
                     allCronJobsInNamespaceSchema
                 }) => new GraphQLObjectType({
    name: 'all',
    description: 'All kube resources.',
    fields: {
        services: {
            type: allServicesSchema.type,
            description: 'All services in all namespaces.',
            resolve(parent, args, context, info) {
                return parent.namespace ?
                    allServicesInNamespaceSchema.resolve(parent, parent, context, info) :
                    allServicesSchema.resolve(parent, parent, context, info)
            }
        },
        deployments: {
            type: allDeploysSchema.type,
            description: 'All deployments in all namespaces.',
            resolve(parent, args, context, info) {
                return parent.namespace ?
                    allDeploysInNamespaceSchema.resolve(parent, parent, context, info) :
                    allDeploysSchema.resolve(parent, parent, context, info)
            }
        },
        pods: {
            type: allPodsSchema.type,
            description: 'All pods in all namespaces.',
            resolve(parent, args, context, info) {
                return parent.namespace ?
                    allPodsInNamespaceSchema.resolve(parent, parent, context, info) :
                    allPodsSchema.resolve(parent, parent, context, info)
            }
        },
        daemonSets: {
            type: allDaemonSetsSchema.type,
            description: 'All daemonsets in all namespaces.',
            resolve(parent, args, context, info) {
                return parent.namespace ?
                    allDaemonSetsInNamespaceSchema.resolve(parent, parent, context, info) :
                    allDaemonSetsSchema.resolve(parent, parent, context, info)
            }
        },
        replicaSets: {
            type: allReplicaSetsSchema.type,
            description: 'All replicasets in all namespaces.',
            resolve(parent, args, context, info) {
                return parent.namespace ?
                    allReplicaSetsInNamespaceSchema.resolve(parent, parent, context, info) :
                    allReplicaSetsSchema.resolve(parent, parent, context, info)
            }
        },
        statefulSets: {
            type: allStatefulSetsSchema.type,
            description: 'All statefulsets in all namespaces.',
            resolve(parent, args, context, info) {
                return parent.namespace ?
                    allStatefulSetsInNamespaceSchema.resolve(parent, parent, context, info) :
                    allStatefulSetsSchema.resolve(parent, parent, context, info)
            }
        },
        jobs: {
            type: allJobsSchema.type,
            description: 'All jobs in all namespaces.',
            resolve(parent, args, context, info) {
                return parent.namespace ?
                    allJobsInNamespaceSchema.resolve(parent, parent, context, info) :
                    allJobsSchema.resolve(parent, parent, context, info)
            }
        },
        cronJobs: {
            type: allCronJobsSchema.type,
            description: 'All cronjobs in all namespaces.',
            resolve(parent, args, context, info) {
                return parent.namespace ?
                    allCronJobsInNamespaceSchema.resolve(parent, parent, context, info) :
                    allCronJobsSchema.resolve(parent, parent, context, info)
            }
        },
    },
});

// TODO: all by namespace
// TODO: all by label

