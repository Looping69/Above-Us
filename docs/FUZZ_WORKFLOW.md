# Moment Fuzz Testing & CI Integration

## Overview

The Above Us game uses **deterministic fuzz testing** to guard moment unlock reachability from balance regressions. This document explains the workflow, how to use it locally, and how to integrate it into CI/CD pipelines.

## Core Concept

Moment unlock reachability is a **system-level property** — if a moment becomes unreachable or requires an excessive number of actions, the player experience degrades. The fuzz test discovers this by running randomized action sequences (seeded for reproducibility) and measuring the success rate for each moment-character pair.

Success rates are compared between a baseline snapshot and the current code. Any drop beyond a configured tolerance triggers a regression alert.

## Key Artifacts

- **Baseline:** `artifacts/moment-fuzz-diagnostics.baseline.json` — reference snapshot (committed to repo or CI artifact storage)
- **Current:** `artifacts/moment-fuzz-diagnostics.json` — generated on each test run
- **Comparison script:** `scripts/compare-fuzz-diagnostics.ts` — loads both and reports regressions

## Local Workflow

### Generate a New Baseline

When you make intentional balance changes and validate they are correct:

```bash
npm run fuzz:baseline
```

This generates `artifacts/moment-fuzz-diagnostics.baseline.json` with the current success rates. Commit this file to preserve the baseline for future comparisons.

### Run Fuzz Check

During normal development, run the check command:

```bash
npm run fuzz:check
```

This:
1. Runs fuzz diagnostics and saves to `artifacts/moment-fuzz-diagnostics.json`
2. Compares against baseline
3. Reports regressions, improvements, and stable targets
4. Exits with code 0 (pass) or 1 (failure with regressions)

#### Example Output

```
=== Moment Fuzz Diagnostics Comparison ===
Baseline: 2026-06-11T20:55:20.743Z
Current:  2026-06-11T20:55:24.564Z
Tolerance: 5.0%

⚠️  REGRESSIONS (1):
  shared_dream (jay): 0.333 → 0.250 (−8.3%)

✨ IMPROVEMENTS (1):
  breaking_point (zara): 0.979 → 1.000 (+2.1%)

✓ STABLE (4):
  first_vulnerability (lena): 0.396
  ... and 3 more

❌ FAILED: 1 regressions detected.
```

### Configuration

The fuzz test and comparison script use environment variables:

#### For Fuzz Diagnostics Generation

- `ABOVE_US_FUZZ_DIAGNOSTICS=1` — Enable console diagnostics output
- `ABOVE_US_FUZZ_DIAGNOSTICS_ARTIFACT=1` — Enable JSON artifact export
- `ABOVE_US_FUZZ_DIAGNOSTICS_PATH=path/to/artifact.json` — Custom artifact output path (default: `artifacts/moment-fuzz-diagnostics.json`)

#### For Comparison Script

- `ABOVE_US_FUZZ_BASELINE=path/to/baseline.json` — Baseline path (default: `artifacts/moment-fuzz-diagnostics.baseline.json`)
- `ABOVE_US_FUZZ_CURRENT=path/to/current.json` — Current path (default: `artifacts/moment-fuzz-diagnostics.json`)
- `ABOVE_US_FUZZ_TOLERANCE=0.05` — Max allowed rate drop as decimal (default: 0.05 = 5%)

### Debugging Reachability Issues

If a moment regression is detected:

1. Check the detailed diagnostics:
   ```bash
   ABOVE_US_FUZZ_DIAGNOSTICS=1 npm run fuzz:check
   ```
   This prints per-seed success rates and top action mixes used in successful runs.

2. Review the moment requirements in [src/game/data/moment-events.ts](../src/game/data/moment-events.ts) and the corresponding action weighting in [tests/moment-path-fuzz.test.ts](../tests/moment-path-fuzz.test.ts).

3. If the moment's requirements are too strict, loosen them. If the action weighting is wrong, adjust [buildWeightedActions](../tests/moment-path-fuzz.test.ts).

4. Re-run the check to verify the fix.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Balance Regression Check

on: [pull_request, push]

jobs:
  fuzz-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      
      # Fetch baseline from main branch or artifact storage
      - name: Fetch baseline artifact
        run: |
          if [ -f artifacts/moment-fuzz-diagnostics.baseline.json ]; then
            echo "Baseline found locally"
          else
            echo "Downloading baseline from main branch..."
            git show main:artifacts/moment-fuzz-diagnostics.baseline.json > artifacts/moment-fuzz-diagnostics.baseline.json
          fi

      # Run fuzz check
      - name: Run fuzz balance check
        run: npm run fuzz:check
        env:
          ABOVE_US_FUZZ_TOLERANCE: '0.05'
      
      # On failure, upload current artifact for inspection
      - name: Upload current diagnostics on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: fuzz-diagnostics-current
          path: artifacts/moment-fuzz-diagnostics.json
```

### Local Pre-Commit Hook

To prevent pushing balance regressions:

```bash
#!/bin/bash
# .git/hooks/pre-commit

npm run fuzz:check
if [ $? -ne 0 ]; then
  echo "❌ Fuzz check failed. Balance regressions detected."
  exit 1
fi
```

## Understanding Fuzz Output

### Success Rate (Overall)

The aggregate success rate across all seeds and attempts. Example: `0.396` means ~40% of randomized action sequences unlocked the moment.

### Per-Seed Rates

Success rate for each seeded RNG run. Seed variance indicates:
- **Low variance** (all seeds close to overall rate): stable, predictable unlock path
- **High variance** (some seeds pass, some fail): fragile, depends on luck

### Top Action Mixes

The three most-used actions in successful runs. Reveals the primary strategy to unlock the moment.

Example: `steady_presence:0.638 spark_change:0.184 nudge_thought:0.178`  
Interpretation: **calm and trust actions dominate** (63.8%), supplemented by curiosity and alignment nudges.

## Maintenance

### When to Update the Baseline

- After intentional balance changes (moment requirement adjustments, action effect tweaks)
- After significant code refactors (only if rates genuinely change)

**Never** auto-update the baseline in CI; always review and commit deliberately.

### When to Adjust Tolerance

- Default: 5% drop
- **Lower tolerance** (1–3%) if reachability must be strict
- **Higher tolerance** (10%+) during rapid prototyping phases

## Troubleshooting

### "Artifact not found"
Ensure baseline exists:
```bash
npm run fuzz:baseline  # Generate if missing
git add artifacts/moment-fuzz-diagnostics.baseline.json
git commit -m "chore: update fuzz baseline"
```

### "FAILED: X regressions detected"
1. Review the moment requirements and influence actions
2. Check if the fuzz test's action weighting is outdated
3. Adjust requirements or weighting
4. Re-run `npm run fuzz:check` to verify

### High variance in per-seed rates
Action weighting may be skewed. Ensure the heuristic in `buildWeightedActions` reflects the moment's true requirements.

## Next Steps

- Integrate into CI/CD pipeline (see examples above)
- Add per-target success rate thresholds (allow stricter gates on key moments)
- Integrate with performance dashboards to track balance drift over time
