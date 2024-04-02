import { config } from "./config.js";
import { Router, getQuery } from "../deps.js";
import { startAsync, getExecutorsCount } from "./executor.js";
import {
    REQUEST_ID,
    getMemoryUsage,
    getPostParams,
    checkConnection,
} from "../helpers/utils.js";

const started = new Date();

const router = new Router()
    .get("/", (ctx) => {
        ctx.response.body = JSON.stringify({
            status: "UP",
            version: config.VERSION,
            timestamp: new Date().toISOString(),
        });
    })
    .get("/health", (ctx) => {
        const memoryUsage = getMemoryUsage();
        ctx.response.body = JSON.stringify({
            status: "UP",
            timestamp: new Date().toISOString(),
            memory: memoryUsage,
            uptime: Math.floor((Date.now() - started.getTime()) / 1000),
            processes: getExecutorsCount(),
        });
        console.info(`[${ctx.state[REQUEST_ID]}] /health :`, JSON.stringify(memoryUsage));
    })
    .post("/execute", async (ctx) => {
        const requestId = ctx.state[REQUEST_ID];
        let fileName = getQuery(ctx)?.file;
        const postParams = await getPostParams(ctx);
        if (!fileName) fileName = postParams?.file;
        const code = postParams?.code;

        if (!code && !fileName) {
            ctx.throw(400, "Required 'code' or 'file' parameter");
        }
        console.log(`[${requestId}] Executing script: `, fileName, " | Custom code: " + JSON.stringify(code));

        const result = await startAsync(requestId, code, fileName);

        console.log(`[${requestId}] Result`, JSON.stringify(result));
        ctx.response.body = JSON.stringify(result, null, 2);
    })
    .get("/netcheck", async (ctx) => {
        const checkPort = getQuery(ctx)?.port || PORT;
        console.log(`[${ctx.state[REQUEST_ID]}] Checking internet access to port: ${checkPort}`);
        // Check if connection is allowed to the port
        const res = await checkConnection(checkPort);
        if (res.ok) {
            console.warn(`[${ctx.state[REQUEST_ID]}] WARNING: INTERNET Connections allowed on port ${checkPort}`);
            return ctx.response.body = JSON.stringify({ status: "allowed", message: "Connection allowed" });
        }
        return ctx.response.body = JSON.stringify({ status: "denied", message: "Connection refused: " + res.message });
    });

export default router;