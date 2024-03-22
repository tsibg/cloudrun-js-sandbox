import { config } from "./config.js";
import { Application, Router, getQuery } from "./deps.js";
import { startAsync, getExecutorsCount } from "./executor.js";
import {
    REQUEST_ID,
    getMemoryUsage,
    getPostParams,
    getHostPort,
    checkEnvironment,
    checkConnection,
    requestIdMiddleware
} from "./helpers/utils.js";

//LOG if environment variables are enabled
checkEnvironment();

const { HOST, PORT } = getHostPort();
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
        }, null, 2);
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

const app = new Application();
app
    .use(requestIdMiddleware)
    .use(async (ctx, next) => {
        //Middleware
        console.log(`[${ctx.state[REQUEST_ID]}] ${ctx.request.method} ${ctx.request.url}`);
        ctx.response.type = "json";
        await next();
    })
    .use(router.routes())
    .use(router.allowedMethods());


await app.listen({ hostname: HOST, port: PORT });
console.log(`Server started on port http://${HOST}:${PORT}`);
