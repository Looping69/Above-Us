# GAME_AGENT_RDP

## Source Of Truth
This file is the canonical design and implementation reference for the Above Us MVP.
If any guidance conflicts with README or task notes, this document wins.

## Vision
Above Us is an isometric influence simulation where the player is an unseen force shaping lives from above.
Player identity emerges from repeated influence patterns, not upfront class selection.

Core fantasy: you never enter the world directly; you redirect trajectories.

## Design Pillars
- Systems-first outcomes (deterministic): no RNG authority for core progression.
- Multi-dimensional relationships: no single love meter.
- Agency-preserving character interaction: consent gates are systemic constraints.
- Explicit consensual 18+ intimacy is allowed when the game state supports it.
- Replayability through strategic attention allocation and influence patterns.

## MVP Technical Stack
- React + Vite + TypeScript for UI and app shell
- Phaser 3 for world rendering and simulation
- Zustand for shared game state (React <-> Phaser)
- Vitest for unit tests
- localStorage for MVP persistence

## Core MVP Systems
1. Alignment system: manipulator, guardian, tempter, creator.
2. Influence actions: Nudge Thought, Amplify Emotion, Steady Presence, Spark Change.
3. Connection system: trust, curiosity, dependence, attraction, comfort, resistance.
4. Attention system: limited spend with regeneration.
5. Moment system: gated events with stage/arc progression and character scoping.
6. Evolution system: per-character path scoring and threshold-based evolution.
7. Persistence system: autosave/load/reset via localStorage.

## Characters (Adults 18+)
- Lena: ambition vs burnout
- Jay: freedom vs discipline
- Maya: attention vs insecurity
- Ethan: control vs openness
- Zara: intensity vs stability

## System Authority Rules
- Systems decide outcomes; flavour text is secondary.
- Moment triggers must apply declared outcome deltas.
- Evolution is data-driven and character-specific.
- Adult intimacy requires deterministic consent gates such as trust, comfort, low resistance, and adult character status.

## Constraints
- No backend or auth in MVP.
- No monetisation in MVP.
- No LLM API integration in MVP.
- No expansion worlds in MVP.
- No sexual content involving minors, ambiguous adult status, non-consent, coercion, or impaired consent.
- Keep React + Phaser + Zustand architecture.

## Current Audit Notes
- Moment requiredState reachability audit detects missing keys:
  - first_vulnerability requires anxiety (missing for all scoped characters)
  - shared_dream requires ambition (missing for all scoped characters)
  - breaking_point stress is partially missing (zara lacks stress)
- These are tracked for balancing/content follow-up.

## Definition Of Done (MVP Stabilization)
- Build passes.
- Tests pass.
- Docs structure present in /docs and /tasks.
- Moment outcomes applied in runtime.
- Reachability audit coverage present in tests.
