const PORT = Bun.env.PORT || 8080;

//Path to the public folder to serve static files
const PUBLIC_PATH = "./public";

//API URL to proxy requests
const API_HOST = Bun.env.API_HOST || "localhost";
const API_PORT = Bun.env.API_PORT || 8081;
const API_URL = `http://${API_HOST}:${API_PORT}`;

//API path to serve proxy requests
const API_PATH = "/api";

const serveFile = async (req) => {
    let pathname = new URL(req.url).pathname;
    if (pathname === "/") {
        pathname = "/index.html";
    }
    const filePath = PUBLIC_PATH + pathname;
    console.log("[Ingress Proxy] Serving file:", filePath);
    const file = Bun.file(filePath);
    if (!await file.exists()) {
        return new Response(null, { status: 404 })
    };
    return new Response(file);
}

const proxyRequest = async (req) => {
    let pathname = new URL(req.url).pathname;
    pathname = pathname.split(API_PATH, 2).pop();

    const data = await req.text();
    let status;
    const resp = await fetch(`${API_URL}` + pathname, {
        method: req.method,
        headers: req.headers,
        body: data,
    }).then((res) => {
        status = res.status;
        return res.json()
    }).catch((err) => {
        console.error("[Ingress Proxy] API Fetch error:", err);
        return { "error": "Proxy error: API not reachable" };
    });

    console.log("Proxy request:", `${API_URL}` + pathname, req.method, resp.status);
    return Response.json(resp, {
        status: status
    });
}

const router = async (req) => {
    let pathname = new URL(req.url).pathname;
    console.info("[Ingress Proxy] API Request:", req.method, pathname);

    if (pathname.startsWith(API_PATH)) {
        return await proxyRequest(req);
    }
    return serveFile(req);
}

console.info("[Ingress Proxy] Starting BUN server on port", PORT);
Bun.serve({
    port: PORT,
    fetch: router,
    error(err) {
        console.error("[Ingress Proxy] BUN ERROR: ", err);
        return new Response(err.message, { status: 500 });
    },
});