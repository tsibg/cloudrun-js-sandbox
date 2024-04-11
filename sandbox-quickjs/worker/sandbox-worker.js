import { config } from "../config/config.js";
import { getQuickJS, shouldInterruptAfterDeadline } from "../deps.js";
import { LogHandler } from "../handlers/log.js";
import { response } from "../helpers/utils.js";

self.onmessage = async (e) => {
    const { requestId, code } = e.data;
    switch (e.data.cmd) {
        case "execute":
            await executeCmd(requestId, code);
            break;
        case "print":
            console.log(`WORKER[${requestId}]: Print message "${e.data.message}"`);
            self.postMessage(response(null, e.data.message));
            self.close();
            break;
        case "check":
            self.postMessage(response(null, checkPermissions(requestId)));
            self.close();
            break;
        default:
            console.error(`WORKER[${requestId}]: Invalid command`);
            self.postMessage(response({ name: "InvalidCommand", message: "Invalid command" }));
            self.close();
            break;
    }
};

const checkPermissions = (requestId) => {
    console.log(`WORKER[${requestId}]: Checking environment & permissions`);

    const env = checkEnvironment();
    const cwd = checkCWD();
    const sys = checkDenoSystem();
    return { env, cwd, sys };
};


const checkEnvironment = () => {
    try {
        const env = Deno.env.toObject();
        console.warn("WARNING: ENVIRONMENT Variables are ENABLED. " + env.length + "variables found");
        return env;
    } catch (err) {
        console.info("Environment variables DISABLED");
        return false;
    }
}

const checkCWD = () => {
    try {
        const inc = Deno.cwd();
        console.warn("WARNING: READ is ENABLED: " + inc);
        return inc;
    } catch (err) {
        console.info("INCLUDE DISABLED");
        return false;
    }
}

const checkDenoSystem = () => {
    try {
        const uid = Deno.uid();
        console.warn(`WARNING: DENO System is ENABLED. UID: ${uid}`);
        return { uid };
    } catch (err) {
        console.info("Deno System DISABLED");
        return false;
    }
}
const executeCmd = async (requestId, code) => {
    if (!code) {
        console.log(`WORKER[${requestId}]: No code to execute`);

        self.postMessage(response({ name: "NoCode", message: "No code to execute" }));
        self.close();
    }

    console.log(`WORKER[${requestId}] Executing code: [${code.length} chars]`);

    await execute(requestId, code).then((result) => {
        self.postMessage(result);
        self.close();
    }).catch((err) => {
        console.error(`[${requestId}] ERROR in Sandbox runtime: `, err);
        self.postMessage(response({ name: err.name, message: err.toString() }));
        self.close();
    });
}

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

    const log = logHandler.getLog();
    logHandler.clearLog();

    const executionTime = Date.now() - startTime;
    return response(error, returnVal, log, executionTime);
};
