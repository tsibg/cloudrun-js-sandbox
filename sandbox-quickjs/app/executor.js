import { config } from "./config.js";
import { response } from "../helpers/utils.js";

let workers = {};

const startAsync = (requestId, code, scriptFile = null) => {
  return new Promise((resolve) => {
    start(requestId, code, scriptFile, (result) => {
      resolve(result);
    });
  });
}

const start = async (requestId, code, scriptFile = null, cb) => {
  const startTime = Date.now();
  if (scriptFile) {
    code += await readScriptFile(requestId, scriptFile);
  }
  console.log(`[${requestId}] Starting worker`);
  const new_worker = new Worker(import.meta.resolve("../worker/sandbox-worker.js"),
    {
      type: "module",
      deno: {
        namespace: true,
        permissions: {
          env: false,
          hrtime: false,
          net: false,
          ffi: false,
          read: ["./"],
          run: false,
          write: false,
        },
      },
    }
  );
  workers[requestId] = new_worker;

  const new_worker_timeout = setTimeout(() => {
    workers[requestId].terminate();
    console.log(`[${requestId}] Worker Timeout: Terminating worker`);
    delete workers[requestId];
    cb(response({ name: "Worker Timeout", message: `Timeout of ${config.WORKER_TIMEOUT} exceeded.` }, null, [], Date.now() - startTime));
  }, config.WORKER_TIMEOUT);

  new_worker.onmessage = (evt) => {
    // console.log("Received by parent: ", evt.data);
    new_worker_timeout && clearTimeout(new_worker_timeout);
    delete workers[requestId];

    cb(evt.data);
  };
  new_worker.onerror = (err) => {
    console.error(`[${requestId}] Worker Error: `, err);

    new_worker_timeout && clearTimeout(new_worker_timeout);
    delete workers[requestId];

    cb(response({ name: "Worker Error", message: err.name }, null, [], Date.now() - startTime));
  };

  new_worker.postMessage({ requestId, code, cmd: "execute" });
}

const getExecutorsCount = () => {
  return Object.keys(workers).length;
}

const readScriptFile = async (requestId, filename) => {
  let fileContent = "";
  try {
    const textContent = await Deno.readTextFile(filename);
    fileContent += "\n" + textContent + "\n";
  } catch (err) {
    console.error(`[${requestId}] Read file: Error reading file[${filename}]: `, err);
  }
  return fileContent;
}

export { start, startAsync, getExecutorsCount };
