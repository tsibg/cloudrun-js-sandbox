import { config } from "../config/config.js";
import { Router, getQuery } from "../deps.js";
import { startAsync, getExecutorsCount } from "./executor.js";
import {
    REQUEST_ID,
    getMemoryUsage,
    getPostParams,
    checkConnection,
    getHostPort,
    response
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
    .get("/netcheck", async (ctx) => {
        const { PORT } = getHostPort();

        const checkPort = getQuery(ctx)?.port || PORT;
        console.log(`[${ctx.state[REQUEST_ID]}] Checking internet access to port: ${checkPort}`);
        // Check if connection is allowed to the port
        const res = await checkConnection(checkPort);
        if (res.ok) {
            console.warn(`[${ctx.state[REQUEST_ID]}] WARNING: INTERNET Connections allowed on port ${checkPort}`);
            return ctx.response.body = JSON.stringify({
                status: "allowed",
                port: checkPort,
                message: "Warning: Outgoing connection allowed"
            });
        }
        return ctx.response.body = JSON.stringify({
            status: "restricted",
            port: checkPort,
            message: "Network restricted. Outgoing connection refused: " + res.message
        });
    })
    .post("/execute", async (ctx) => {
        const requestId = ctx.state[REQUEST_ID];
        let fileName = getQuery(ctx)?.file;
        const postParams = await getPostParams(ctx);
        if (!fileName) fileName = postParams?.file;
        const code = postParams?.code;

        if (!code && !fileName) {
            ctx.throw(400, JSON.stringify(response("Required 'code' or 'file' parameter")));
        }
        console.log(`[${requestId}] Executing script: `, fileName, " | Custom code: " + JSON.stringify(code));

        const result = await startAsync(requestId, code, fileName);

        console.log(`[${requestId}] Result`, JSON.stringify(result));
        ctx.response.body = JSON.stringify(result, null, 2);
    });


export default router;