# JS Sandbox Backend for CloudRun/Docker
_Under development_

JavaScript Sandbox backend designed to run in GCP Cloud Run or Docker Compose. Provides
REST API for execution of user-provided JavaScript code server-side.

Built in JavaScript with
[QuickJS-Emscripten](https://github.com/justjake/quickjs-emscripten), Deno, Deno
Workers and Docker Containers.

This setup _**should**_ provide a secure*, isolated, and efficient environment
for running untrusted JavaScript code server-side.

***I developed this project for hobby/evaluation purposed. NO
WARRANTIES PROVIDED. It needs future Security evaluations.**

## Description

The project uses QuickJS as interpreter and leverages Cloud Run's gVisor and Docker containers to provide the
necessary isolation of the entire sandbox service.

Built in 2 microservices as separate containers:

### 1. **ingress-sidecar** - Proxy incomming requests

All `/api` HTTP requests are proxied to the sandbox microservice for purposes of
network isolation of the main container. The ingress container also serves a
sample frontend for demonstration and testing purposes.

_Built with Bun_

### 2. **sandbox-quickjs** - JS Sandbox service

Executes the provided JS code with QuickJS-Emscripten. Running in Deno, spawns
Deno Worker for each execution request.

- [QuickJS](https://bellard.org/quickjs/) is a small JavaScript engine in C.
  Interprets JS code pretty efficiently, supporting ECMAscript up to ES2023.
- [QuickJS-Emscripten](https://github.com/justjake/quickjs-emscripten) - 
  used for the actual sandboxing. For the purpose of isolation this library
  provides safe JS runtime by using QuckJS + WASM. It also provides
  resource limitations, APIs to provide/obtain data and to expose custom
  functionalities from the host. TBD: Documentation for exposing APIs to the
  sandbox.

- Deno runtime - provides granular security restrictions. Allows to restrict the
  builtin JS APIs for network, file system, environment and process. Also
  ensures further developments are not accidentally exposing APIs to provide
  excessive system-level access than intended. See also
  [Deno permissions](https://docs.deno.com/runtime/manual/basics/permissions)
- [Deno Workers](https://docs.deno.com/runtime/manual/runtime/workers) are used
  for handling concurrent executions in multiple threads and to apply execution
  timeouts effectively.
- Docker - Provides isolation of the 2 microservices and ease deployments
- GCP Cloud Run (v1 with gVisor) for runtime environment of the containers.
  Documentation for the container isolation:
  https://cloud.google.com/run/docs/container-contract#sandbox

## REST API Endpoints:

[POST] `/api/execute`

Accepts JSON-encoded body:

- code - Code to be executed
- file - (optional) Any of the provided test scripts in
  `/sandbox-quickjs/example-scripts`. Eg: `log.js`, `pi.js`, `simple.js`

OUTPUT: JSON

Example output:

```json
{
  "status": "success",
  "result": 3,
  "error": false,
  "log": [
    {
      "type": "log",
      "timestamp": "2024-04-24T09:50:41.362Z",
      "data": [
        "Hello!"
      ]
    }
  ],
  "executionTime": 65
}
```

@ToDo: Document the other endpoints

## Deploy in Cloud Run

Please, setup your service names and regions inside `cloudbuild.yaml` and
`cloudrun.yaml`.

```
gclouds builds submit
```

## Run with Docker Compose

You can alternatively run the services with Docker Compose. 

Note that Docker does not provided
virtualization of the resources. However the provided JS code is interpreted by
QuickJS and any additionally exposed host functionality is up to the developer.

```
docker compose up --build
```

## Development

@ToDo: Update development documentation and how to expose additional variables and functionality to the endpoint.

### ToDo List

1. Use envsubst for filling `cloudrun.yaml` with the variables available from
   `cloudbuild.yaml`
2. Update `cloudbuild.yaml` to exclude the extra deploy step, which is currently
   needed in order `service replace` to work.
3. Write tests to the ingress service
4. Add descriptions on how to use and further develop based on this repo
5. Add the availability to provide code from URL, S3, GCS. Load the file from
   the ingress service and provide it as shared volume in the memory for the
   sandbox service.
6. Add rate limits in the ingress service
7. Test under pressure

### License
[MIT License](https://opensource.org/license/mit)
