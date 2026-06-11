# ROADMAP

## Source Of Truth
Master design direction: /docs/GAME_AGENT_RDP.md

## Completed
- MVP core loop implemented.
- Arc/stage moment progression with character scoping.
- Character evolution system with per-character rules.
- localStorage save/load/reset.
- Collapsible character sidebar and progression hints.

## Stabilization (Current)
- Ensure moment outcomes always apply at trigger time.
- Keep tests and docs in sync with runtime behavior.
- Resolve impossible/partial moment state gates.

## Next Safe Steps
1. Moment balancing pass
- Fix requiredState keys that are currently missing on scoped characters.
- Add content-safe alternatives where needed.

2. Evolution balancing pass
- Tune thresholds and per-character mapping weights.
- Add milestone events at evolution lock-in.

3. UX polish
- Add clearer arc/evolution status indicators.
- Add in-game summary of key progression changes after actions.

## Deferred (Post-MVP)
- Richer character routines and schedule simulation.
- Expanded moment catalog.
- Optional narrative flavour layer.
