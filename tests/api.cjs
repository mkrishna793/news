const assert = require("node:assert/strict");
const base = process.env.ATLAS_TEST_URL || "http://localhost:3000";
async function json(path, options) {
  const response = await fetch(base + path, options);
  return { response, data: await response.json() };
}
(async () => {
  const invalid = await json("/api/project-research?repo=not-a-repo");
  assert.equal(invalid.response.status, 400);
  const health = await json("/api/refresh");
  assert.equal(health.response.status, 200);
  assert.equal(typeof health.data.running, "boolean");
  assert.ok(Array.isArray(health.data.results));
  const rows = await json("/api/items?limit=1");
  if (rows.data.items.length) {
    const id = rows.data.items[0].id;
    const saves = await json("/api/items?saved=1&limit=200");
    const wasSaved = saves.data.items.some((x) => x.id === id);
    try {
      const result = await json(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ saved: true }),
      });
      assert.equal(result.response.status, 200);
      const saved = await json("/api/items?saved=1&limit=200");
      assert.ok(
        saved.data.items.some((x) => x.id === id),
        "Save persists in the database",
      );
      const article = await fetch(`${base}/item/${id}`);
      assert.equal(article.status, 200);
      assert.match(await article.text(), /In the authors/);
    } finally {
      await json(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ saved: wasSaved }),
      });
    }
  }
  const [a, b] = await Promise.all([
    json("/api/refresh", { method: "POST" }),
    json("/api/refresh", { method: "POST" }),
  ]);
  assert.equal(a.response.status, 200);
  assert.equal(b.response.status, 200);
  assert.equal(
    a.data.startedAt,
    b.data.startedAt,
    "Concurrent refresh requests share a single ingestion run",
  );
  assert.equal(a.data.running, true);
  console.log(
    "PASS: API validation, source status, persisted saves, original-source article rendering and concurrent refresh lock",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
