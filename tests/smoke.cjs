const { chromium } = require("@playwright/test");
const bundled = require("@sparticuz/chromium").default;
const assert = require("node:assert/strict");
(async () => {
  await require("@sparticuz/chromium").inflate(
    require("node:path").resolve(
      "node_modules/@sparticuz/chromium/bin/al2023.tar.br",
    ),
  );
  process.env.LD_LIBRARY_PATH = ["/tmp/al2023/lib", process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(":");
  const browser = await chromium.launch({
    executablePath: await bundled.executablePath(),
    args: bundled.args,
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.screenshot({ path: ".atlas/desktop.png", fullPage: true });
  assert.match(await page.locator("h1").innerText(), /A world of ideas/);
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("button", { name: "rose", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "rose");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "rose",
  );
  assert.equal(await page.locator("html").getAttribute("data-theme"), "rose");
  await page.getByRole("tab", { name: /Quantum biology/ }).click();
  assert.equal(
    await page
      .getByRole("tab", { name: /Quantum biology/ })
      .getAttribute("data-state"),
    "active",
  );
  await page.goto("http://localhost:3000/quantum-biology");
  await page.getByRole("heading", { name: /Life, through/ }).waitFor();
  await page.goto("http://localhost:3000/project-research");
  await page.getByLabel("Public GitHub repository").fill("bad repository");
  await page
    .getByRole("button", { name: "Explore repository", exact: true })
    .click();
  await page.locator(".status-notice[role=alert]").waitFor();
  assert.match(
    await page.locator(".status-notice[role=alert]").innerText(),
    /owner\/name/,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000");
  await page.screenshot({ path: ".atlas/mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "Mobile must not overflow",
  );
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  assert.equal(await page.locator(".mobile-nav").isVisible(), true);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS: desktop, theme persistence, tabs, quantum biology, validation, mobile navigation and overflow; no browser errors",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
