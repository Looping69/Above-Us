# Above Us

**Isometric Influence Simulation with Emergent Relationships**

An experimental game where the player is an unseen force observing a modern city from above, shaping the lives of five characters through influence actions. The game explores what kind of entity the player becomes based on their repeated choices.

> **Core Idea:** The player shapes the world from above, and the world reveals who the player is becoming.

## Quick Start

## Source Of Truth

For active agent-driven development, the canonical design authority is `docs/GAME_AGENT_RDP.md`.
Supporting structure and planning docs live in `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, and `docs/CONTENT_GUIDE.md`.

### Install Dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build
```bash
npm run build
```
Outputs to `dist/`. Suitable for hosting on Vercel or any static host.

### Tests
```bash
npm run test
npm run test:watch
```

## Architecture

### Tech Stack
- **React 18** – UI (HUD, panels, menus)
- **Vite** – Build & dev server
- **TypeScript** – Type-safe systems
- **Phaser 3** – Isometric rendering, game loop
- **Zustand** – Shared game state
- **Zod** – Data validation
- **Vitest** – Unit tests

### Project Structure
```
src/
  app/          App.tsx, main React entry
  game/
    types/      Character, Influence, Alignment, Moment types
    data/       characters.ts, influence-actions.ts, moment-events.ts
    systems/    alignment, influence, connection, moment logic
    scenes/     BootScene, WorldScene (Phaser)
    iso/        Isometric math utilities
    PhaserGame.ts
  ui/
    components/ HUD, CharacterPanel, InfluenceMenu, MomentPanel
    stores/     useGameStore (Zustand)
docs/
tests/
```

## Core Systems

### 1. **Alignment System**
Tracks player identity across 4 dimensions:
- `manipulator` – subtle control, psychological nudges
- `guardian` – protection, support, stability
- `tempter` – desire, risk, escalation
- `creator` – growth, transformation, unlocking potential

Player identity emerges from **repeated actions**, not upfront choice.

### 2. **Influence Actions** (4 starting actions)
1. **Nudge Thought** (1 attention) – curiosity +1 → Manipulator
2. **Amplify Emotion** (3 attention) – attraction +2, resistance +1 → Tempter
3. **Steady Presence** (2 attention) – trust +2, comfort +2, resistance -1 → Guardian
4. **Spark Change** (2 attention) – curiosity +2, trust +1 → Creator

### 3. **Character Connection** (6 dimensions per character)
- `trust` – believes in your presence
- `curiosity` – wants to understand you
- `dependence` – relies on your influence
- `attraction` – drawn to your energy
- `comfort` – feels safe around you
- `resistance` – pushes back against you

Multi-dimensional → **different playstyles create different outcomes**.

### 4. **Moment Events**
High-value emotional, dramatic, or romantic events triggered when requirements are met:
- `first_connection` – basic moment unlocked at trust ≥5, curiosity ≥4, resistance ≤3
- `charged_silence`, `boundary_named`, `private_vow` – explicit 18+ intimacy arc gated by trust, comfort, alignment, and low resistance
- Extensible: add more moments by editing `/src/game/data/moment-events.ts`

### 5. **Attention System**
Limited resource (start: 10/10). Actions cost attention; attention regenerates over time.
Strategic tension: **focus on one character or spread influence across many?**

## Characters (MVP)

| Name  | Role                | Tension                  | Evolution Paths |
|-------|---------------------|--------------------------|-----------------|
| Lena  | Corporate climber   | Ambition vs burnout      | Burnout, Breakthrough, Dependence |
| Jay   | Unemployed creative | Freedom vs discipline    | Artist, Lost, Dependent |
| Maya  | Event organiser     | Attention vs insecurity  | Leader, Obsessed, Burnout |
| Ethan | Engineer            | Control vs openness      | Opened, Rigid, Dependent |
| Zara  | Nightlife risk-taker| Intensity vs stability   | Self-destruction, Awakening, Obsession |

**All characters are adults (18+).**

## Key Constraints

- ✅ Modular, data-driven code
- ✅ Multi-dimensional intimacy (connection, not single meter)
- ✅ Character agency maintained; influence sets conditions, not outcomes
- ✅ Explicit consensual 18+ relationship content allowed when gated by trust, comfort, and resistance
- ✅ TypeScript strict mode enforced
- ❌ No sexual content involving minors, non-consensual intimacy, coercion, or ambiguous adult status
- ❌ No monetisation in MVP
- ❌ No authentication / backend in MVP
- ❌ No LLM integration yet (systems-only MVP)

## Design Philosophy

**Systems decide what happens. LLM (future) decides how it feels.**

The core engine is deterministic. Every influence action → guaranteed outcome. No RNG in core systems. This ensures replayability and strategic depth.

Later, an optional LLM layer can generate character thoughts, dialogue, and flavour text — but systems remain the authority.

## Roadmap

### MVP (complete)
- ✅ 5 characters with full state
- ✅ 4 influence actions
- ✅ Alignment & connection tracking
- ✅ Isometric grid & movement
- ✅ Selection & detail panel
- ✅ Character-scoped moment events with outcome effects
- ✅ Character evolution progress, local save/load, visual feedback, and fuzz balance checks
- ✅ 25+ tests covering core systems

### Next Phase (Post-MVP)
- [x] More moment events and multi-stage arcs
- [ ] NPC-to-NPC relationships (jealousy, mentorship, romance)
- [x] Character evolution progress based on influence patterns
- [x] Save/load system (localStorage MVP)
- [x] Visual effects (influence particles)
- [ ] Character evolution consequences in dialogue/UI/world behaviour
- [ ] Time system (days, seasons, routines)
- [ ] World events (job loss, promotion, social drama)

### Expansion Phase
- [ ] Expansion worlds (Medieval, Cyberpunk, Fantasy)
- [ ] Cloud save (Supabase)
- [ ] Analytics & telemetry
- [ ] LLM character mind layer (optional)
- [ ] Mobile version (Capacitor)

## Testing

### Unit Tests
All core systems have unit tests:
- `alignment-system.test.ts` – alignment tracking and identity detection
- `influence-system.test.ts` – action effects and state changes
- `connection-system.test.ts` – connection clamping and deltas
- `moment-system.test.ts` – requirement gates and triggering
- `character-data.test.ts` – data integrity (all adults, all fields present)

Run: `npm run test`

### Balance Regression Testing (Fuzz)
Moment unlock reachability is guarded by a deterministic fuzz test that runs randomized action sequences and measures success rates. This catches subtle balance regressions.

**Local workflow:**
```bash
# Check current balance against baseline
npm run fuzz:check

# After intentional balance adjustments, commit new baseline
npm run fuzz:baseline
git add artifacts/moment-fuzz-diagnostics.baseline.json
git commit -m "chore: update fuzz baseline"
```

See [docs/FUZZ_WORKFLOW.md](docs/FUZZ_WORKFLOW.md) for full CI/CD integration guide, debugging strategies, and configuration options.

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy dist/ to Vercel
```

### Static Hosting
```bash
npm run build
# Deploy dist/ to any static host (GitHub Pages, Netlify, etc.)
```

## Development Notes

- **Phaser scene tightly coupled to Zustand store** — works for MVP; can be decoupled via event emitter later
- **Phaser bundle ~1.6MB** — acceptable for web game; code-split when needed
- **Persistent save is local-only** — localStorage works for MVP; cloud save is a later expansion
- **Character movement is random walk** — replace with AI/routine system later

## Contributing

Follow the patterns in existing systems:
1. Define types in `src/game/types/`
2. Create data files in `src/game/data/`
3. Create systems in `src/game/systems/`
4. Add tests in `tests/`
5. Update Zustand store in `src/ui/stores/useGameStore.ts` if needed
6. Add React UI in `src/ui/components/` if needed

**All code must be TypeScript with strict types. No `any` in core systems.**

## License

Experimental. Not yet licensed for public distribution.

---

**Last Updated:** June 2026 | **Status:** MVP Complete | **Primary Developer:** Above Us Agent
