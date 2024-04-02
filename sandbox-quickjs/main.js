import {
    getHostPort,
    checkEnvironment,
} from "./helpers/utils.js";

//LOG if environment variables are enabled
checkEnvironment();

const { HOST, PORT } = getHostPort();
await application.listen({ hostname: HOST, port: PORT });

console.log(`Server started on port http://${HOST}:${PORT}`);
