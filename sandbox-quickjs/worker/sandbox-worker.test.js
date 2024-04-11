import { assertNotEquals, assertObjectMatch, assertStrictEquals } from "https://deno.land/std/assert/mod.ts";
import { describe, it, beforeEach, afterEach } from "https://deno.land/std/testing/bdd.ts";

const requestId = "test";
// Function to handle worker messages
const workerMessage = (worker) => {
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
            worker.terminate(); // terminate the worker after receiving the message
            resolve(e.data);
        };
        worker.onerror = (e) => {
            worker.terminate();
            reject(e);
        };
    });
}

describe('TestSuite: Sandbox Worker', () => {
    let worker;
    let response;
    beforeEach(() => {
        worker = new Worker(import.meta.resolve("./sandbox-worker.js"), {
            type: "module",
            deno: {
                namespace: false,
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
        });
    });

    afterEach(() => {
        worker.terminate();
    });

    it('should receive message from worker', async () => {
        const message = { requestId, cmd: "print", message: 'Test message' };
        worker.postMessage(message);

        response = await workerMessage(worker);

        assertObjectMatch(response, { error: false, result: 'Test message' });
    });

    //Test basic code execution in worker
    it('should execute code in worker', async () => {
        const message = { requestId, cmd: "execute", code: '1+2' };
        worker.postMessage(message);

        response = await workerMessage(worker);


        assertObjectMatch(response, { error: false, result: 3 });
    });

    it('should handle code with syntax error', async () => {
        const message = { requestId, cmd: "execute", code: '1+' };
        worker.postMessage(message);

        response = await workerMessage(worker);

        assertNotEquals(response.error, false);
        assertObjectMatch(response.error, { name: "SyntaxError" });
    });

    it('should handle invalid command', async () => {
        const message = { requestId, cmd: "invalid", code: '1+' };
        worker.postMessage(message);

        response = await workerMessage(worker);

        assertNotEquals(response.error, false);
        assertObjectMatch(response.error, { name: "InvalidCommand" });
    });

    it('should handle missing code in execute command', async () => {
        const message = { requestId, cmd: "execute" };
        worker.postMessage(message);

        response = await workerMessage(worker);

        assertNotEquals(response.error, false);
        assertObjectMatch(response.error, { name: "NoCode" });
    });

    it('should have the correct permissions', async () => {
        const message = { requestId, cmd: "check" };
        worker.postMessage(message);

        response = await workerMessage(worker);

        assertObjectMatch(response, { error: false });
        assertObjectMatch(response.result, { env: false, sys: false });
        assertStrictEquals(response.result.cwd, Deno.cwd());
    });
});