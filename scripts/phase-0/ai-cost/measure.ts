/**
 * Phase 0 AI Cost Measurement Script
 *
 * Runs realistic Background Twin + Foreground Assist prompts via OpenRouter
 * (Gemini Flash Lite) and measures actual token usage + cost. Extrapolates to
 * monthly cost per active merchant.
 *
 * Usage (must use --env-file flag like other phase-0 spikes):
 *   npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/ai-cost/measure.ts --dry-run
 *   npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/ai-cost/measure.ts --sample 10
 *   npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/ai-cost/measure.ts --full
 *
 * Output: ai-cost-report-*.md in scripts/phase-0/ai-cost/output/
 *
 * Pre-committed kill criterion: cost > RM 30/merchant/month at RM 79 max → kill.
 */

import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import {
  PAYMENT_MATCH_PROMPT,
  CUSTOMER_MEMORY_PROMPT,
  PATTERN_DETECTION_PROMPT,
} from "./prompts/background-twin";
import {
  REPLY_DRAFT_PROMPT,
  COMPLAINT_DRAFT_PROMPT,
  PRICING_WHISPER_PROMPT,
} from "./prompts/foreground-assist";
import { SCENARIOS, totalMonthlyEvents, type Scenario } from "./scenarios";

// ============================================================================
// Constants
// ============================================================================

const MODEL = "google/gemini-flash-1.5-8b"; // Closest to Flash Lite via OpenRouter

// OpenRouter pricing (verify at https://openrouter.ai/models — refresh quarterly)
const PRICING_PER_1K = {
  input: 0.0000375, // $0.0000375 per 1K input tokens
  output: 0.00015, // $0.00015 per 1K output tokens
};

const USD_TO_MYR = 4.7;

// ============================================================================
// Types
// ============================================================================

interface Measurement {
  scenarioId: string;
  type: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  output: string;
  error?: string;
}

interface AggregatedReport {
  totalScenarios: number;
  byType: Record<
    string,
    {
      count: number;
      avgInputTokens: number;
      avgOutputTokens: number;
      avgCostUsd: number;
      avgLatencyMs: number;
      monthlyFrequency: number;
      monthlyCostUsd: number;
    }
  >;
  totalMonthlyCostUsd: number;
  totalMonthlyCostMyr: number;
  pricingTierVerdict: "PASS_RM49" | "PASS_RM79" | "MARGINAL" | "KILL";
  rawMeasurements: Measurement[];
}

// ============================================================================
// Token estimation (for dry-run)
// ============================================================================

/**
 * Rough token estimate: 1 token ≈ 4 chars English / ~3 chars BM/Manglish mix.
 * Conservative: use 3.5 chars/token average.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

// ============================================================================
// Prompt routing
// ============================================================================

function getSystemPrompt(scenarioType: Scenario["type"]): string {
  switch (scenarioType) {
    case "reply_draft":
      return REPLY_DRAFT_PROMPT;
    case "complaint_draft":
      return COMPLAINT_DRAFT_PROMPT;
    case "pricing_whisper":
      return PRICING_WHISPER_PROMPT;
    case "payment_match":
      return PAYMENT_MATCH_PROMPT;
    case "customer_memory":
      return CUSTOMER_MEMORY_PROMPT;
    case "pattern_detection":
      return PATTERN_DETECTION_PROMPT;
    default:
      throw new Error(`Unknown scenario type: ${scenarioType}`);
  }
}

// ============================================================================
// OpenRouter API call
// ============================================================================

async function callOpenRouter(
  systemPrompt: string,
  userInput: string,
  maxOutputTokens: number,
): Promise<{
  inputTokens: number;
  outputTokens: number;
  output: string;
  latencyMs: number;
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY not set. Copy .env.phase-0.example → .env.phase-0 and add key.",
    );
  }

  const start = Date.now();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://tokoflow.com",
      "X-Title": "Tokoflow Phase 0 Cost Measurement",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
      max_tokens: maxOutputTokens,
      temperature: 0.3,
    }),
  });
  const latencyMs = Date.now() - start;

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${text}`);
  }

  const data = await response.json();
  return {
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    output: data.choices?.[0]?.message?.content ?? "",
    latencyMs,
  };
}

// ============================================================================
// Main measurement
// ============================================================================

async function measureScenario(
  scenario: Scenario,
  dryRun: boolean,
): Promise<Measurement> {
  const systemPrompt = getSystemPrompt(scenario.type);
  const userInput = scenario.inputContext;

  if (dryRun) {
    const inputTokens = estimateTokens(systemPrompt + userInput);
    const outputTokens = scenario.expectedOutputMaxTokens;
    const costUsd =
      (inputTokens / 1000) * PRICING_PER_1K.input +
      (outputTokens / 1000) * PRICING_PER_1K.output;
    return {
      scenarioId: scenario.id,
      type: scenario.type,
      inputTokens,
      outputTokens,
      costUsd,
      latencyMs: 0,
      output: "[DRY RUN — no actual API call]",
    };
  }

  try {
    const result = await callOpenRouter(
      systemPrompt,
      userInput,
      scenario.expectedOutputMaxTokens,
    );
    const costUsd =
      (result.inputTokens / 1000) * PRICING_PER_1K.input +
      (result.outputTokens / 1000) * PRICING_PER_1K.output;
    return {
      scenarioId: scenario.id,
      type: scenario.type,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd,
      latencyMs: result.latencyMs,
      output: result.output,
    };
  } catch (err) {
    return {
      scenarioId: scenario.id,
      type: scenario.type,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      latencyMs: 0,
      output: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// Aggregation + reporting
// ============================================================================

function aggregate(measurements: Measurement[]): AggregatedReport {
  const byType: AggregatedReport["byType"] = {};

  for (const m of measurements) {
    if (m.error) continue;
    if (!byType[m.type]) {
      byType[m.type] = {
        count: 0,
        avgInputTokens: 0,
        avgOutputTokens: 0,
        avgCostUsd: 0,
        avgLatencyMs: 0,
        monthlyFrequency: 0,
        monthlyCostUsd: 0,
      };
    }
    const bucket = byType[m.type];
    bucket.count++;
    bucket.avgInputTokens += m.inputTokens;
    bucket.avgOutputTokens += m.outputTokens;
    bucket.avgCostUsd += m.costUsd;
    bucket.avgLatencyMs += m.latencyMs;
  }

  // Average and project
  for (const type in byType) {
    const bucket = byType[type];
    if (bucket.count === 0) continue;
    bucket.avgInputTokens /= bucket.count;
    bucket.avgOutputTokens /= bucket.count;
    bucket.avgCostUsd /= bucket.count;
    bucket.avgLatencyMs /= bucket.count;

    // Sum monthlyFrequency across all scenarios of this type
    bucket.monthlyFrequency = SCENARIOS.filter((s) => s.type === type).reduce(
      (sum, s) => sum + s.monthlyFrequency,
      0,
    );
    bucket.monthlyCostUsd = bucket.avgCostUsd * bucket.monthlyFrequency;
  }

  const totalMonthlyCostUsd = Object.values(byType).reduce(
    (sum, b) => sum + b.monthlyCostUsd,
    0,
  );
  const totalMonthlyCostMyr = totalMonthlyCostUsd * USD_TO_MYR;

  let pricingTierVerdict: AggregatedReport["pricingTierVerdict"];
  if (totalMonthlyCostMyr <= 15) pricingTierVerdict = "PASS_RM49";
  else if (totalMonthlyCostMyr <= 25) pricingTierVerdict = "PASS_RM79";
  else if (totalMonthlyCostMyr <= 30) pricingTierVerdict = "MARGINAL";
  else pricingTierVerdict = "KILL";

  return {
    totalScenarios: measurements.length,
    byType,
    totalMonthlyCostUsd,
    totalMonthlyCostMyr,
    pricingTierVerdict,
    rawMeasurements: measurements,
  };
}

function formatReport(report: AggregatedReport, dryRun: boolean): string {
  const verdict =
    report.pricingTierVerdict === "PASS_RM49"
      ? "✅ PASS — Pro tier RM 49 viable (margin >69%)"
      : report.pricingTierVerdict === "PASS_RM79"
      ? "✅ PASS — Pro tier RM 79 viable (margin >68%)"
      : report.pricingTierVerdict === "MARGINAL"
      ? "⚠️ MARGINAL — adjust scope or shift Pro tier upward"
      : "❌ KILL TRIGGER #1 HIT — unit economics broken at RM 79 max";

  const lines: string[] = [];
  lines.push("# Phase 0 AI Cost Measurement Report");
  lines.push("");
  lines.push(`**Mode**: ${dryRun ? "DRY RUN (token estimates, no API calls)" : "REAL"}`);
  lines.push(`**Model**: ${MODEL}`);
  lines.push(`**Scenarios run**: ${report.totalScenarios}`);
  lines.push(`**Total monthly events per merchant**: ${totalMonthlyEvents()}`);
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Verdict");
  lines.push("");
  lines.push(verdict);
  lines.push("");
  lines.push(`**Total monthly cost per merchant**: $${report.totalMonthlyCostUsd.toFixed(4)} USD = RM ${report.totalMonthlyCostMyr.toFixed(2)} MYR`);
  lines.push("");
  lines.push("## Per-type breakdown");
  lines.push("");
  lines.push("| Type | Count | Avg Input Tokens | Avg Output Tokens | Avg Cost (USD) | Monthly Freq | Monthly Cost (USD) | Monthly Cost (RM) |");
  lines.push("|---|---|---|---|---|---|---|---|");

  for (const [type, bucket] of Object.entries(report.byType)) {
    lines.push(
      `| ${type} | ${bucket.count} | ${bucket.avgInputTokens.toFixed(0)} | ${bucket.avgOutputTokens.toFixed(0)} | $${bucket.avgCostUsd.toFixed(6)} | ${bucket.monthlyFrequency} | $${bucket.monthlyCostUsd.toFixed(4)} | RM ${(bucket.monthlyCostUsd * USD_TO_MYR).toFixed(2)} |`,
    );
  }

  lines.push("");
  lines.push("## Sensitivity analysis");
  lines.push("");
  lines.push("| Scale | Multiplier | Monthly Cost (RM) |");
  lines.push("|---|---|---|");
  lines.push(`| 50 orders (baseline) | 1× | RM ${report.totalMonthlyCostMyr.toFixed(2)} |`);
  lines.push(`| 100 orders (Pro heavy) | 2× | RM ${(report.totalMonthlyCostMyr * 2).toFixed(2)} |`);
  lines.push(`| 200 orders (Business) | 4× | RM ${(report.totalMonthlyCostMyr * 4).toFixed(2)} |`);
  lines.push(`| Peak Ramadan (5×) | 5× | RM ${(report.totalMonthlyCostMyr * 5).toFixed(2)} |`);
  lines.push("");
  lines.push("## Pricing tier recommendation");
  lines.push("");

  if (report.pricingTierVerdict === "PASS_RM49") {
    lines.push("- **Pro**: RM 49/mo — margin sustainable");
    lines.push("- **Business**: RM 99/mo — comfortable margin");
    lines.push("- **Free**: cap at 50 orders/mo (subsidy ~RM 5/mo per Free user)");
  } else if (report.pricingTierVerdict === "PASS_RM79") {
    lines.push("- **Pro**: RM 79/mo (shift up from RM 49)");
    lines.push("- **Business**: RM 99-129/mo");
    lines.push("- **Free**: cap at 25 orders/mo to limit subsidy");
    lines.push("");
    lines.push("> Update [`05-pricing.md`](../../../docs/positioning/05-pricing.md) Pro tier to RM 79.");
  } else if (report.pricingTierVerdict === "MARGINAL") {
    lines.push("- Reduce scope: drop pattern_detection or pricing_whisper from Phase 1");
    lines.push("- Or test cheaper model variants (Gemini 1.5 Flash 8B already cheap; try DeepSeek or Llama 3.1 8B)");
    lines.push("- Recompute after scope reduction");
  } else {
    lines.push("- **KILL TRIGGER HIT** — unit economics not viable at any pricing tier under RM 79");
    lines.push("- Decision: re-architect (smaller twin scope) OR pivot segment OR accept lifestyle ceiling");
    lines.push("- Update [`07-decisions.md`](../../../docs/positioning/07-decisions.md) with formal D-XXX entry before any code work resumes");
  }

  if (!dryRun) {
    lines.push("");
    lines.push("## Sample outputs (review for quality)");
    lines.push("");
    for (const m of report.rawMeasurements.slice(0, 3)) {
      if (m.error) {
        lines.push(`### ${m.scenarioId} — ERROR`);
        lines.push(`\`\`\`\n${m.error}\n\`\`\``);
      } else {
        lines.push(`### ${m.scenarioId}`);
        lines.push(`\`\`\`\n${m.output.slice(0, 400)}\n\`\`\``);
      }
      lines.push("");
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("*See [README.md](./README.md) for methodology. Update [`05-pricing.md`](../../../docs/positioning/05-pricing.md) tentative tiers based on this verdict.*");

  return lines.join("\n");
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sampleArg = args.find((a) => a.startsWith("--sample"));
  const isFull = args.includes("--full");

  let scenariosToRun: Scenario[];

  if (dryRun) {
    scenariosToRun = SCENARIOS;
    console.log(`📊 Dry run: estimating cost for all ${SCENARIOS.length} scenarios (no API calls)`);
  } else if (sampleArg) {
    const n = parseInt(sampleArg.split(/[\s=]/)[1] ?? "10");
    // Take 1 scenario from each type, repeat to fill n
    const uniqueTypes = [...new Set(SCENARIOS.map((s) => s.type))];
    scenariosToRun = [];
    let i = 0;
    while (scenariosToRun.length < n) {
      const type = uniqueTypes[i % uniqueTypes.length];
      const candidates = SCENARIOS.filter((s) => s.type === type);
      scenariosToRun.push(candidates[Math.floor(i / uniqueTypes.length) % candidates.length]);
      i++;
    }
    console.log(`📊 Sample run: ${n} scenarios (~$1-2 USD spend expected)`);
  } else if (isFull) {
    scenariosToRun = SCENARIOS;
    console.log(`📊 Full run: ${SCENARIOS.length} scenarios (~$5-15 USD spend expected)`);
  } else {
    console.log("Usage:");
    console.log("  pnpm tsx scripts/phase-0/ai-cost/measure.ts --dry-run");
    console.log("  pnpm tsx scripts/phase-0/ai-cost/measure.ts --sample 10");
    console.log("  pnpm tsx scripts/phase-0/ai-cost/measure.ts --full");
    process.exit(1);
  }

  console.log("");

  const measurements: Measurement[] = [];
  for (const [idx, scenario] of scenariosToRun.entries()) {
    process.stdout.write(`  [${idx + 1}/${scenariosToRun.length}] ${scenario.id}... `);
    const m = await measureScenario(scenario, dryRun);
    if (m.error) {
      console.log(`❌ ${m.error}`);
    } else {
      console.log(`✓ ${m.inputTokens}+${m.outputTokens} tok, $${m.costUsd.toFixed(6)}, ${m.latencyMs}ms`);
    }
    measurements.push(m);
  }

  const report = aggregate(measurements);
  const reportText = formatReport(report, dryRun);

  console.log("");
  console.log(`📈 Total monthly cost per merchant: $${report.totalMonthlyCostUsd.toFixed(4)} USD = RM ${report.totalMonthlyCostMyr.toFixed(2)} MYR`);
  console.log(`🎯 Verdict: ${report.pricingTierVerdict}`);
  console.log("");

  // Write report
  const outputDir = resolve(__dirname, "output");
  await mkdir(outputDir, { recursive: true });
  const filename = dryRun
    ? "ai-cost-report-dry-run.md"
    : `ai-cost-report-${new Date().toISOString().slice(0, 10)}.md`;
  const reportPath = resolve(outputDir, filename);
  await writeFile(reportPath, reportText);
  console.log(`📄 Report written to: ${reportPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
