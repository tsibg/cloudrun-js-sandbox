import { superoak } from "https://deno.land/x/superoak@4.7.0/mod.ts";
import { describe, it } from "https://deno.land/std/testing/bdd.ts";
import { assertEquals, assertExists, assertNotEquals, assertObjectMatch } from "https://deno.land/std/assert/mod.ts";

import application from "./app/application.js";

describe('TestSuite: Application/Router smoke test', () => {

    it(
        "should return a JSON response with status UP",
        async () => {
            const request = await superoak(application);
            const response = await request
                .get("/")
                .expect(200)
                .expect("Content-Type", /json/);

            assertObjectMatch(response.body, { status: "UP" });
        });

    it(
        "should return a JSON response with status UP and memory usage for /health",
        async () => {
            const request = await superoak(application);
            const response = await request
                .get("/health")
                .expect(200)
                .expect("Content-Type", /json/);

            assertObjectMatch(response.body, { status: "UP", processes: 0 });
            assertExists(response.body.memory);
            assertExists(response.body.uptime);
        });
});

describe('TestSuite: Executor Smoke Test', () => {
    it(
        "should execute code",
        async () => {
            const request = await superoak(application);
            const response = await request
                .post("/execute")
                .send({ code: "1+2" })
                .expect(200)
                .expect("Content-Type", /json/);

            assertObjectMatch(response.body, { error: false, result: 3 });
        });

    it(
        "should return a 400 error for /execute without 'code' or 'file' parameter",
        async () => {
            const request = await superoak(application);
            await request
                .post("/execute")
                .expect(400);
        });
});