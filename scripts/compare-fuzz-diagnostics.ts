/**
 * Compare moment fuzz diagnostics artifacts and detect reachability regressions.
 * 
 * Usage:
 *   npx tsx scripts/compare-fuzz-diagnostics.ts [--baseline <path>] [--current <path>] [--tolerance <rate>]
 * 
 * Env vars (fallback):
 *   ABOVE_US_FUZZ_BASELINE: baseline artifact path (default: artifacts/moment-fuzz-diagnostics.baseline.json)
 *   ABOVE_US_FUZZ_CURRENT: current artifact path (default: artifacts/moment-fuzz-diagnostics.json)
 *   ABOVE_US_FUZZ_TOLERANCE: max allowed rate drop as decimal (default: 0.05 = 5%)
 */

import { readFileSync, existsSync } from 'node:fs';

type DiagnosticsArtifact = {
  generatedAt: string;
  seeds: number[];
  attemptsPerSeed: number;
  targets: Array<{
    targetLabel: string;
    overallSuccessRate: number;
    seedSuccessRates: Record<number, number>;
    topActionMixes: Array<{ actionId: string; usageRate: number }>;
  }>;
};

type ComparisonResult = {
  baseline: string;
  current: string;
  tolerance: number;
  regressions: Array<{
    targetLabel: string;
    baselineRate: number;
    currentRate: number;
    drop: number;
  }>;
  improvements: Array<{
    targetLabel: string;
    baselineRate: number;
    currentRate: number;
    gain: number;
  }>;
  unchanged: Array<{
    targetLabel: string;
    rate: number;
  }>;
};

function parseArgs(): { baseline: string; current: string; tolerance: number } {
  const args = process.argv.slice(2);
  let baseline = process.env.ABOVE_US_FUZZ_BASELINE ?? 'artifacts/moment-fuzz-diagnostics.baseline.json';
  let current = process.env.ABOVE_US_FUZZ_CURRENT ?? 'artifacts/moment-fuzz-diagnostics.json';
  let tolerance = parseFloat(process.env.ABOVE_US_FUZZ_TOLERANCE ?? '0.05');

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--baseline' && args[i + 1]) baseline = args[i + 1];
    if (args[i] === '--current' && args[i + 1]) current = args[i + 1];
    if (args[i] === '--tolerance' && args[i + 1]) tolerance = parseFloat(args[i + 1]);
  }

  return { baseline, current, tolerance };
}

function loadArtifact(path: string): DiagnosticsArtifact {
  if (!existsSync(path)) {
    throw new Error(`Artifact not found: ${path}`);
  }
  const content = readFileSync(path, 'utf8');
  return JSON.parse(content) as DiagnosticsArtifact;
}

function compareArtifacts(baseline: DiagnosticsArtifact, current: DiagnosticsArtifact, tolerance: number): ComparisonResult {
  const baselineMap = new Map(baseline.targets.map((t) => [t.targetLabel, t.overallSuccessRate]));
  const currentMap = new Map(current.targets.map((t) => [t.targetLabel, t.overallSuccessRate]));

  const regressions: ComparisonResult['regressions'] = [];
  const improvements: ComparisonResult['improvements'] = [];
  const unchanged: ComparisonResult['unchanged'] = [];

  for (const [label, currentRate] of currentMap.entries()) {
    const baselineRate = baselineMap.get(label);
    if (baselineRate === undefined) {
      continue;
    }

    const drop = baselineRate - currentRate;
    if (drop > tolerance) {
      regressions.push({ targetLabel: label, baselineRate, currentRate, drop });
    } else if (currentRate - baselineRate > 0.001) {
      improvements.push({ targetLabel: label, baselineRate, currentRate, gain: currentRate - baselineRate });
    } else {
      unchanged.push({ targetLabel: label, rate: currentRate });
    }
  }

  return { baseline: baseline.generatedAt, current: current.generatedAt, tolerance, regressions, improvements, unchanged };
}

function formatResult(result: ComparisonResult): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('=== Moment Fuzz Diagnostics Comparison ===');
  lines.push(`Baseline: ${result.baseline}`);
  lines.push(`Current:  ${result.current}`);
  lines.push(`Tolerance: ${(result.tolerance * 100).toFixed(1)}%`);
  lines.push('');

  if (result.regressions.length > 0) {
    lines.push(`⚠️  REGRESSIONS (${result.regressions.length}):`);
    for (const r of result.regressions) {
      const percentDrop = (r.drop * 100).toFixed(1);
      lines.push(
        `  ${r.targetLabel}: ${r.baselineRate.toFixed(3)} → ${r.currentRate.toFixed(3)} (−${percentDrop}%)`
      );
    }
    lines.push('');
  }

  if (result.improvements.length > 0) {
    lines.push(`✨ IMPROVEMENTS (${result.improvements.length}):`);
    for (const imp of result.improvements) {
      const percentGain = (imp.gain * 100).toFixed(1);
      lines.push(`  ${imp.targetLabel}: ${imp.baselineRate.toFixed(3)} → ${imp.currentRate.toFixed(3)} (+${percentGain}%)`);
    }
    lines.push('');
  }

  if (result.unchanged.length > 0) {
    lines.push(`✓ STABLE (${result.unchanged.length}):`);
    for (const u of result.unchanged.slice(0, 3)) {
      lines.push(`  ${u.targetLabel}: ${u.rate.toFixed(3)}`);
    }
    if (result.unchanged.length > 3) {
      lines.push(`  ... and ${result.unchanged.length - 3} more`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function main(): Promise<void> {
  const { baseline: baselinePath, current: currentPath, tolerance } = parseArgs();

  console.info(`Loading baseline: ${baselinePath}`);
  const baseline = loadArtifact(baselinePath);

  console.info(`Loading current: ${currentPath}`);
  const current = loadArtifact(currentPath);

  const result = compareArtifacts(baseline, current, tolerance);
  console.info(formatResult(result));

  if (result.regressions.length > 0) {
    console.error(`\n❌ FAILED: ${result.regressions.length} regressions detected.`);
    process.exit(1);
  }

  console.info('\n✅ PASSED: No regressions detected.');
  process.exit(0);
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
