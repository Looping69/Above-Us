# CONTENT_GUIDE

## Source Of Truth
Narrative and content constraints align with /docs/GAME_AGENT_RDP.md.

## Content Rules
- All intimacy-capable characters are adults (18+).
- Character agency remains inviolable.


## Moment Authoring Rules
- Every moment must define:
  - id, stage, arcId, title, description, tone
  - requirements
  - outcome.connectionDelta and outcome.stateDelta
- Requirements should be triggerable for at least one scoped character.
- If using requiredState keys, verify those keys exist in scoped character.state or are intentionally introduced via systems.

## Evolution Authoring Rules
- evolutionPaths in character data should map to character-specific rules.
- New influence actions must be considered in axis mapping balance.
- Evolution lock-in should be meaningful and communicated in UI.

## Naming Guidance
- Use concise ids (snake_case).
- Use human-readable titles for UI.
- Keep descriptions atmospheric but system-compatible.

## Testing Content Changes
- Add/adjust tests in tests/moment-system.test.ts when adding moments.
- Add/adjust tests in tests/evolution-system.test.ts when changing evolution rules.
