# qlkube

qlkube is a graphql api for kubernetes, allowing you to interact with all the features of the Kubernetes api using graphql.

qlkube's graphql schema is dynamically built from the openapi/swagger api specification exposed by the Kubernetes cluster it 
is running in - qlkube should therefore:
- expose *all* the types and operations from the Kubernetes rest api in its grapqhl api
- be consistent with the exact Kubernetes api version of your cluster and kept up to date if and when this changes

In addition to the directly mapped operations from the openapi spec, qlkube provides an 'all' query type that gives a more
natural 'kubectl' influenced interface into the api.

qlkube ships with the Apollo GraphQL Playground, so you can play around with the api straight away.

![Demo](docs/qlkube.gif)

## Example Queries

The 'all' resource is the easiest query type to use for querying kubernetes resources of all types (services, pods, deployments etc).
qlkube also exposes all the low-level resources autogenerated from the Kubernetes openapi/swagger api - these types are 
named exactly as the 'operationId' in the openapi spec, they can therefore seem quite 'low-level' and sometimes unintuitive in comparison. 

<details>
 <summary>Get all pods in all namespaces</summary>
 
 This query returns the names and namespaces of all the pods in the cluster.
 (here we use the more friendly 'all' type - you can perform a similar query using `listCoreV1PodForAllNamespaces`)
 
```graphql
query getAllPodsInAllNamespaces {
  all {
    pods {
      items {
        metadata {
          name
          namespace
        }
      }
    }
  }
}
```

Output:

```json
{
  "data": {
    "all": {
      "pods": {
        "items": [
          {
            "metadata": {
              "name": "alpha-7c766f4fc7-2bh8m",
              "namespace": "default"
            }
          },
          {
            "metadata": {
              "name": "alpha-7c766f4fc7-hx8ml",
              "namespace": "default"
            }
          },
          {
            "metadata": {
              "name": "alpha-7c766f4fc7-ztpph",
              "namespace": "default"
            }
          },
          {
            "metadata": {
              "name": "beta-v1-597679f796-k5gn4",
              "namespace": "default"
            }
          },
          {
            "metadata": {
              "name": "beta-v1-597679f796-x7hsl",
              "namespace": "default"
            }
          },
          {
            "metadata": {
              "name": "gamma-79bc488b5b-srmxm",
              "namespace": "default"
            }
          },
...etc
```
</details> 

<details>
 <summary>Get all pods in a specific namespace</summary>
 
 This query returns the names, namespaces, creation times and labels of all the pods in the 'default' namespace
 (here we use the more friendly 'all' type - you can perform a similar query using `ioK8sApiCoreV1PodList`)
 
```graphql
query getAllPodsInDefaultNamespace {
  all(namespace: "default") {
    pods {
      items {
        metadata {
          name
          namespace
          creationTimestamp
          labels
        }
      }
    }
  }
}
```

Output:

```json
{
  "data": {
    "all": {
      "pods": {
        "items": [
          {
            "metadata": {
              "name": "alpha-7c766f4fc7-2bh8m",
              "namespace": "default",
              "creationTimestamp": "2019-06-03T15:07:17Z",
              "labels": {
                "app": "alpha",
                "appKubernetesIoManagedBy": "skaffold-v0.29.0",
                "appId": "github.expedia.biz_hotels_alpha",
                "podTemplateHash": "7c766f4fc7",
                "skaffoldDevBuilder": "local",
                "skaffoldDevCleanup": "true",
                "skaffoldDevDeployer": "kubectl",
                "skaffoldDevDockerApiVersion": "1.39",
                "skaffoldDevTagPolicy": "git-commit",
                "skaffoldDevTail": "true",
                "version": "v1"
              }
            }
          },
...etc          
```
</details> 


<details>
 <summary>Get all kubernetes resources with a specific label</summary>

This query gets the names of all kubernetes resources (services, deployments, pods etc) that are labelled with label 'app=alpha' 
(roughly equivalent to `kubectl get all -l app=alpha`)

```graphql
query allResourcesOfApp {
  all(labelSelector:"app=alpha") { 
    services {
      items {
        metadata {
          name
        }
      }
    }
    deployments {
      items {
        metadata {
          name
        }
      }
    }
    pods {
      items {
        metadata {
          name
        }
      }
    }
    daemonSets {
      items {
        metadata {
          name
        }
      }
    }
    replicaSets {
      items {
        metadata {
          name
        }
      }
    }
    statefulSets {
      items {
        metadata {
          name
        }
      }
    }
    jobs {
      items {
        metadata {
          name
        }
      }
    }
    cronJobs {
      items {
        metadata {
          name
        }
      }
    } 
    namespaces {
      items {
        metadata {
          name
        }
      }
    }
  }
}
```

Output:

```json
{
  "data": {
    "all": {
      "services": {
        "items": [
          {
            "metadata": {
              "name": "alpha"
            }
          }
        ]
      },
      "deployments": {
        "items": [
          {
            "metadata": {
              "name": "alpha"
            }
          }
        ]
      },
      "pods": {
        "items": [
          {
            "metadata": {
              "name": "alpha-7c766f4fc7-2bh8m"
            }
          },
...etc          
```

</details> 

## Example Mutations

<details>
 <summary>Create namespace</summary>
 
This mutation creates a new 'bar' namespace. The input json is the escaped version of the following:
 
```json
{
    "apiVersion": "v1",
    "kind": "Namespace",
    "metadata": {
        "name": "bar"
    }
}
```

We output the creation timestamp for the new namesapce.
  
```graphql
mutation createNamespace {
  createCoreV1Namespace(input: "{\"apiVersion\":\"v1\",\"kind\":\"Namespace\",\"metadata\":{\"name\":\"bar\"}}") {
    metadata {
      creationTimestamp
    }
  }
}
```

Output:

```json
{
  "data": {
    "createCoreV1Namespace": {
      "metadata": {
        "creationTimestamp": "2019-06-03T22:37:02Z"
      }
    }
  }
}
```

</details> 

## Running

### Quickstart

qlkube is designed to be run inside the kubernetes cluster. 
The included [quickstart.yaml](deployments/quickstart.yaml) manifest should get you started: 

```
kubectl apply -f deployments/quickstart.yaml 
kubectl port-forward svc/qlkube 8080:80
```

Navigate to http://localhost:8080/ in your browser - this will launch the GraphQL Playground which you can use to interact
with the kubernetes api.

### Skaffold
 
The included [skaffold.yaml](skaffold.yaml) can be used to build and deploy from source 
(note that in production you may want to restrict the permissive RBAC settings in `deployments/deployment.yaml`).
N.B. you need [skaffold](https://github.com/GoogleContainerTools/skaffold) installed!

```
skaffold dev
kubectl port-forward svc/qlkube 8080:80
```

Navigate to http://localhost:8080/ in your browser - this will launch the GraphQL Playground which you can use to interact
with the kubernetes api.

### Out of cluster (dev mode)

For playing around locally you can run qlkube from source outside of the cluster. To do this you must first proxy the Kubernetes
api server to http://localhost:8001:

```
kubectl proxy
```

You can then run qlkube locally, which will connect to the proxied Kubernetes api:

```
npm run local
```

Navigate to http://localhost:8080/ in your browser - this will launch the GraphQL Playground which you can use to interact
with the kubernetes api.

### Environment variables (settings)

`NODE_ENV` - `string`, set to `production` to mute stacktrace proxying to a client, see more [here](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production)

`IN_CLUSTER`- `bool`, set to `false` if you run outside of Kubernetes cluster

`KUBERNETES_HOST` - `string`, path to Kubernetes cluster API, use with `IN_CLUSTER=false`

`KUBE_SCHEMA_TOKEN` - `string`, a token from account, which will be used to request OpenAPI schema of Kubernetes cluster, use with `IN_CLUSTER=false`

`USE_JWT_AUTH` - `bool`, set to `false` if you do not want to proxify client `Authorization` header to Kubernetes and want to use `KUBE_SCHEMA_TOKEN` for all user requests

## Schema

The generated graphql schema is served at /schema