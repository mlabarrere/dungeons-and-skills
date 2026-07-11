/* live.mjs — the real API backend (Anthropic). Implements a bounded tool loop so that in
   engine-enabled conditions the MODEL actually calls the engine and interprets the result
   (spec §3). Never run by default; needs a key. No secret is ever logged. */
import { writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RUN_ENGINE_TOOL = {
  name: "run_engine",
  description: "Run the deterministic D&D engine. command=options|build|check on an answers/model object.",
  input_schema: { type: "object", properties: {
    command: { type: "string", enum: ["options", "build", "check"] },
    payload: { type: "object", description: "answers (options/build) or a character model (check)" },
    lang: { type: "string", enum: ["fr", "en"] },
  }, required: ["command", "payload"] },
};

function execEngine(input) {
  const dir = mkdtempSync(join(tmpdir(), "bench-eng-"));
  const f = join(dir, "payload.json");
  writeFileSync(f, JSON.stringify(input.payload || {}), "utf8");
  const args = ["engine/cli.mjs", input.command, f];
  if (input.lang) args.push("--lang", input.lang);
  try { return execFileSync("node", args, { cwd: ROOT, timeout: 30000 }).toString().slice(0, 8000); }
  catch (e) { return `ENGINE ERROR: ${(e.stdout || "") + (e.stderr || e.message)}`.slice(0, 8000); }
}

const extractText = (content) => (content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
const parseJSON = (text) => { const m = text.match(/\{[\s\S]*\}/); if (!m) throw new Error("no JSON in reply"); return JSON.parse(m[0]); };

export async function callLive({ model, apiKey, system, user, tool_access, reasoningBudget = 0, timeoutMs = 120000 }) {
  const endpoint = model.providerCfg.endpoint;
  const useTool = tool_access.includes("run_engine");
  const messages = [{ role: "user", content: user }];
  const t0 = Date.now();
  let toolTime = 0, toolCalls = 0, inTok = 0, outTok = 0, reasonTok = 0;

  for (let iter = 0; iter < 8; iter++) {
    const body = { model: model.api_id, max_tokens: 3000, system, messages };
    if (useTool) body.tools = [RUN_ENGINE_TOOL];
    if (reasoningBudget > 0) body.thinking = { type: "enabled", budget_tokens: reasoningBudget };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let data;
    try {
      const res = await fetch(endpoint, { method: "POST", signal: ctrl.signal,
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": model.providerCfg.apiVersion },
        body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
      data = await res.json();
    } finally { clearTimeout(timer); }

    inTok += data.usage?.input_tokens || 0; outTok += data.usage?.output_tokens || 0;
    reasonTok += data.usage?.thinking_tokens || 0;
    const toolUses = (data.content || []).filter((b) => b.type === "tool_use");
    if (data.stop_reason === "tool_use" && toolUses.length) {
      messages.push({ role: "assistant", content: data.content });
      const results = [];
      for (const tu of toolUses) {
        const s = Date.now(); const out = execEngine(tu.input || {}); toolTime += Date.now() - s; toolCalls++;
        results.push({ type: "tool_result", tool_use_id: tu.id, content: out });
      }
      messages.push({ role: "user", content: results });
      continue;
    }
    const text = extractText(data.content);
    return { response: parseJSON(text), usage: { input: inTok, output: outTok, reasoning: reasonTok },
      timing: { total_ms: Date.now() - t0, tool_ms: toolTime, tool_calls: toolCalls }, raw_text: text };
  }
  throw new Error("tool loop did not converge in 8 iterations");
}
