import { Application } from "../deps.js";
import { REQUEST_ID, requestIdMiddleware } from "../helpers/utils.js";
import router  from "./router.js";

const application = new Application();
application
    .use(requestIdMiddleware)
    .use(async (ctx, next) => {
        //Middleware to log request
        console.log(`[${ctx.state[REQUEST_ID]}] ${ctx.request.method} ${ctx.request.url}`);
        await next();
        //Set response type to JSON
        ctx.response.type = "json";
    })
    .use(router.routes())
    .use(router.allowedMethods());

export default application;