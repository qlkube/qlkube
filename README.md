# qlkube

qlkube is a graphql api for kubernetes, allowing you to interact with all the features of the Kubernetes api using graphql.

qlkube's graphql schema is dynamically built from the openapi/swagger api specification exposed by the Kubernetes cluster it 
is running in - qlkube should therefore:
- expose *all* the types and operations from the Kubernetes rest api in its grapqhl api
- be consistent with the exact Kubernetes api version of your cluster and kept up to date if and when this changes

In addition to the directly mapped operations from the openapi spec, qlkube provides an 'all' query type that gives a more
natural 'kubectl' influenced interface into the api.


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
  }
}
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
</details> 


## Running

### In Cluster

qlkube is designed to be run inside the kubernetes cluster. 
The included [skaffold](skaffold.yaml) file should get you started (note that in production you may want to restrict 
the permissive RBAC settings in `deployments/deployment.yaml`).
N.B. you need [skaffold](https://github.com/GoogleContainerTools/skaffold) installed.

```
skaffold dev
kubectl port-forward svc/qlkube 8080:80
```

Navigate to http://localhost:8080/ in your browser - this will launch the GraphQL Playground which you can use to interact
with kubernetes with using qlkube.

### Out of cluster (dev mode)

For playing around locally you can run qlkube outside of the cluster. To do this you must first proxy the Kubernetes
api server to http://localhost:8001:

```
kubectl proxy
```

You can then run qlkube locally, which will connect to the proxied Kubernetes api:

```
npm run local
```

Navigate to http://localhost:8080/ in your browser - this will launch the GraphQL Playground which you can use to interact
with kubernetes with using qlkube.