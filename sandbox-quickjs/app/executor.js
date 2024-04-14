import { config } from "../config/config.js";
import { response } from "../helpers/utils.js";

const workers = {};
const workersTimeout = {};

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

  workersTimeout[requestId] = setTimeout(() => {
    console.log(`[${requestId}] Worker Timeout: Terminating worker`);
    terminate(requestId);
    cb(response({ name: "Executor Timeout", message: `Timeout of ${config.WORKER_TIMEOUT} exceeded.` }, null, [], Date.now() - startTime));
  }, config.WORKER_TIMEOUT);

  new_worker.onmessage = (evt) => {
    // console.log("Received by parent: ", evt.data);
    terminate(requestId);
    cb(evt.data);
  };

  new_worker.onerror = (err) => {
    console.error(`[${requestId}] Worker Error: `, err);
    terminate(requestId);
    cb(response({ name: "Executor Error", message: err.name }, null, [], Date.now() - startTime));
  };

  new_worker.postMessage({ requestId, code, cmd: "execute" });
}
const terminate = (requestId) => {
  if (workersTimeout[requestId]) {
    clearTimeout(workersTimeout[requestId]);
    delete workersTimeout[requestId];
  }
  if (workers[requestId]) {
    workers[requestId].terminate();
    delete workers[requestId];
    return true;
  }
  return false;
}
const getExecutorsCount = () => {
  return Object.keys(workers).length;
}

const readScriptFile = async (requestId, filename) => {
  let fileContent = "";
  try {
    const textContent = await Deno.readTextFile(config.EXAMPLES_DIR + filename);
    fileContent += "\n" + textContent + "\n";
  } catch (err) {
    console.error(`[${requestId}] Read file: Error reading file[${filename}]: `, err);
  }
  return fileContent;
}

export { start, startAsync, getExecutorsCount };
