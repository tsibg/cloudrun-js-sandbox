
const REQUEST_ID = "X-Request-ID";

const getPostParams = async (ctx) => {
    const bodyType = ctx.request.body.type();
    let params = {};
    if (bodyType === "json") {
        params = await ctx.request.body.json();
    } else if (bodyType === "form-data") {
        params = await ctx.request.body.formData().then(data => {
            let obj = {};
            data.forEach((value, key) => {
                obj[key] = value;
            });
            return obj;
        });
    }
    return params;
}

//Get memory usage
const getMemoryUsage = () => {
    return {
        rss: Number(Deno.memoryUsage().rss / 1024 / 1024).toFixed(2),
        heapTotal: Number(Deno.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
        heapUsed: Number(Deno.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        external: Number(Deno.memoryUsage().external / 1024 / 1024).toFixed(2),
        units: "MB"
    }
}

// Check if environment variables are enabled
const checkEnvironment = () => {
    try {
        const env = Deno.env.toObject();
        console.warn("WARN: ENVIRONMENT Variables are ENABLED. " + env.length + "variables found");
        return env;
    } catch (err) {
        console.log("Environment variables DISABLED");
        return false;
    }
}

const requestIdMiddleware = async (ctx) => {
    if (ctx.state[REQUEST_ID]) return;
    const reqId = crypto.randomUUID().split("-", 1);
    ctx.state[REQUEST_ID] = reqId;
    ctx.response.headers.set(REQUEST_ID, reqId);
};

const getHostPort = () => {
    let HOST = "127.0.0.1";
    let PORT = 8081;

    try {
        HOST = Deno.env.get("HOST") || "127.0.0.1";
        PORT = Deno.env.get("PORT") || 8081;
        console.log(`Using env HOST and PORT: http://${HOST}:${PORT}`);
    }
    catch (err) {
        console.log(`Using default HOST and PORT: http://${HOST}:${PORT}`);
    }
    return { HOST, PORT };
}


const response = (error, result = null, log = [], time = 0) => {
    const data = {
        status: error ? "error" : "success",
        result: result || null,
        error: error || false,
        log,
        executionTime: time
    };
    return data;
}

export {
    REQUEST_ID,
    getPostParams,
    getMemoryUsage,
    checkEnvironment,
    getHostPort,
    requestIdMiddleware,
    response
};