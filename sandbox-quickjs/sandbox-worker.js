import { config } from "./config.js";
import { getQuickJS, shouldInterruptAfterDeadline } from "./deps.js";
import { LogHandler } from "./expose-handlers/log.js";
import { response } from "./helpers/utils.js";

self.onmessage = async (e) => {
    const { requestId, code } = e.data;
    console.log(`WORKER[${requestId}]: Received code: [${code.length} chars]`);
    if (!code) {
        self.postMessage(response({ name: "No code", message: "No code to execute" }));
        self.close();
    }

    await execute(requestId, code).then((result) => {
        self.postMessage(result);
        self.close();
    }).catch((err) => {
        console.error(`[${requestId}] ERROR in Sandbox runtime: `, err);
        self.postMessage(response({ name: err.name, message: err.toString() }));
        self.close();
    });
};


const configRuntime = (rt) => {
    const deadLine = Date.now() + config.RUNTIME_TIMEOUT;
    rt.setMemoryLimit(config.RUNTIME_MEMORY_LIMIT);
    rt.setMaxStackSize(config.RUNTIME_STACK_SIZE);
    rt.setInterruptHandler(shouldInterruptAfterDeadline(deadLine));
}

const execute = async (requestId, code) => {
    const startTime = Date.now();
    let returnVal = null, error = null;

    const QuickJS = await getQuickJS();
    const runtime = QuickJS.newRuntime(); // Create a new runtime;
    configRuntime(runtime);

    const vm = runtime.newContext();
    configRuntime(runtime);

    // Attach log functions
    const logHandler = new LogHandler();
    logHandler.attachLog(vm);

    try {
        const result = vm.evalCode(code);
        if (result.error) {
            error = vm.dump(result.error);
            result.error.dispose();
        } else {
            returnVal = vm.dump(result.value);
            result.value.dispose();
        }
    } catch (err) {
        console.error(`[${requestId}]QUCKJS Runtime Error: `, err);
        error = {
            name: "SandboxError",
            message: err.toString()
        }
    }

    vm.dispose();
    runtime.dispose();

    const executionTime = Date.now() - startTime;
    return response(error, returnVal, logHandler.getLog(), executionTime);
};
