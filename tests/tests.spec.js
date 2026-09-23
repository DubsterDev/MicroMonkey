// @ts-check
import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";

test("has title", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });   
    
    const mpy = spawn(
        "/home/dubster/source/repos/micropython/ports/unix/build-standard/micropython",
        ["-i"],
        {
            stdio: ["pipe", "pipe", "pipe"],
        }
    );

    mpy.on("spawn", () => {
        console.log("MicroPython spawned");
    });
    
    mpy.on("exit", (code, signal) => {
        console.log("MicroPython exited:", { code, signal });
    });
    
    mpy.on("close", (code, signal) => {
        console.log("MicroPython closed:", { code, signal });
    });
    
    mpy.on("error", (err) => {
        console.error("MicroPython process error:", err);
    });
    
    mpy.stdout.on("data", (data) => {
        console.log("MPY STDOUT:", JSON.stringify(data.toString()));
    });
    
    mpy.stderr.on("data", (data) => {
        console.log("MPY STDERR:", JSON.stringify(data.toString()));
    });

    // Node side of the JavascriptInterface.
    await page.exposeFunction("serialPolyfillWrite", (base64) => {
        const bytes = Buffer.from(base64, "base64");
        mpy.stdin.write(bytes);
    });

    // Browser side of the JavascriptInterface.
    await page.addInitScript(() => {
        window.serialPolyfill = {
            write(base64) {
                window.serialPolyfillWrite(base64);
            },

            requestPort() {
                return true;
            },

            close() {
                // Nothing to close here for now.
            },
        };
    });

    // MicroPython -> browser.
    mpy.stdout.on("data", async (chunk) => {
        const base64 = Buffer.from(chunk).toString("base64");

        await page.evaluate((base64) => {
            serialInterface._receiveSerialData(base64);
        }, base64);
    });

    mpy.stderr.on("data", (chunk) => {
        console.error("MicroPython:", chunk.toString());
    });

    await page.goto("http://localhost:5173/");

    await expect(page).toHaveTitle(/MicroMonkey/);

    await page.waitForTimeout(60000);

    mpy.kill();
});
