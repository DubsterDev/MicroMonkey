// @ts-check
import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { rm, mkdir, writeFile } from "node:fs/promises";

await rm("/tmp/micromonkey", { recursive: true, force: true });
await mkdir("/tmp/micromonkey", { recursive: true });
await writeFile("/tmp/micromonkey/main.py", "print(\"Welcome!\")");

let currentPage;

let mpy = spawn(
    "./micropython/ports/unix/build-standard/micropython",
    ["-i"],
    {
        stdio: ["pipe", "pipe", "pipe"],
    },
);

mpy.stdout.on("data", async (chunk) => {
    const base64 = Buffer.from(chunk).toString("base64");

    if (currentPage) {
        try {
            await currentPage.evaluate((base64) => {
                try {
                    serialInterface._receiveSerialData(base64);
                } catch {}
            }, base64);
        } catch {}
    }
});

mpy.stderr.on("data", (chunk) => {
    console.error("MicroPython:", chunk.toString());
});

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

test.afterAll(async () => {
  mpy.kill();
});

test("shows welcome page", async ({ page }) => {
    await setupPage(page)

    await expect(page.locator("#boardStatus")).toHaveText("Disconnect");

    await expect(page.locator("#customEditor h2")).toHaveText("Welcome to MicroMonkey!");
})

test("can open settings", async ({ page }) => {
    await setupPage(page)

    await expect(page.locator("#boardStatus")).toHaveText("Disconnect");

    await page.keyboard.press("Control+Shift+P");
    await page.keyboard.type("settings\n");

    await expect(page.locator("#customEditor h2")).toHaveText("Settings");
})

test("can connect", async ({ page }) => {
    await setupPage(page)

    await expect(page.locator("#boardStatus")).toHaveText("Disconnect");

    await expect(page.locator("div[data-file-explorer-path]")).toHaveText(
        /main.py/,
    );
});

test("can create file", async ({ page }) => {
    await setupPage(page)

    await expect(page.locator("#boardStatus")).toHaveText("Disconnect");
    
    await page.locator('#newFileRoot').click();

    await expect(page.locator("#commandPaletteTitle")).toHaveText("Enter a name for the file")
    
    await page.keyboard.type("playwright_file.txt\n");

    await page.waitForTimeout(500);

    await expect(page.locator('p[title="/playwright_file.txt"]')).toHaveText("playwright_file.txt");
})

test("does ask for save confirmation", async ({ page }) => {
    await setupPage(page)

    await expect(page.locator("#boardStatus")).toHaveText("Disconnect");
    
    await page.locator('p[title="/main.py"]').click();

    await expect(page.locator("#codeEditor")).toHaveText(/print\("Welcome!"\)/);

    await page.locator(".monaco-editor").nth(0).click();
    await page.keyboard.type("\nprint('This was typed by Playwright')");

    await page.locator(".tab.active").getByText('close', { exact: true }).click();

    await expect(page.locator("#commandPaletteTitle")).toHaveText("main.py isn't saved. Are you sure you want to close it?")
})

async function setupPage(page) {
    currentPage = page;

    await page.exposeFunction("serialPolyfillWrite", (base64) => {
        const bytes = Buffer.from(base64, "base64");
        mpy.stdin.write(bytes);
    });

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

    await page.goto("http://localhost:5173/");
    await page.locator("#boardStatus").click();

    await page.waitForTimeout(500)
}