# CONTENT_GUIDE

## Source Of Truth
Narrative and content constraints align with /docs/GAME_AGENT_RDP.md.

## Content Rules
- All intimacy-capable characters are adults (18+).
- Character agency remains inviolable.
- Explicit consensual adult content is allowed when system gates support it.
- Explicit scene text must respect the persisted 18+ Scenes preference in UI.
- Do not include sexual content involving minors, ambiguous adult status, non-consent, coercion, or impaired consent.

## Moment Authoring Rules
- Every moment must define:
  - id, stage, arcId, title, description, tone
  - requirements
  - outcome.connectionDelta and outcome.stateDelta
- Adult intimacy moments must require enough trust, comfort, and low resistance to model consent and mutual willingness.
- Adult content payloads must declare `rating: 'explicit_18'` and `consent: 'affirmed'`.
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
- Add/adjust preference coverage when changing adult-content visibility behavior.
