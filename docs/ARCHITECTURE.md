# ARCHITECTURE

## Source Of Truth
Design authority: /docs/GAME_AGENT_RDP.md

## Layers
- UI Layer (React): HUD, CharacterPanel, InfluenceMenu, MomentPanel.
- Simulation/Render Layer (Phaser): WorldScene, grid, movement, interaction visuals.
- State Layer (Zustand): shared state/actions across React and Phaser.
- Domain Layer (Systems): alignment, influence, connection, moment, evolution.
- Data Layer: characters, influence actions, moments, arcs, evolution rules.

## Data Flow
1. Player chooses influence action from React UI.
2. Zustand store applyAction executes domain systems.
3. Influence updates alignment, connection, state, evolution.
4. Moment system evaluates gates and arc progression.
5. Triggered moment applies outcome deltas.
6. UI updates from store subscriptions.
7. Autosave persists meaningful state changes.

## Key Modules
- src/game/systems/alignment-system.ts
- src/game/systems/influence-system.ts
- src/game/systems/connection-system.ts
- src/game/systems/moment-system.ts
- src/game/systems/evolution-system.ts
- src/ui/stores/useGameStore.ts

## Persistence Boundaries
Saved:
- characterStates
- connections
- alignment
- evolutionByCharacter
- attention
- triggeredMoments

Not saved:
- ephemeral UI selections (except what store naturally carries)
- transient effects and scene-only visuals

## Testing Strategy
- Unit tests for systems and data integrity.
- Integration-style store test for moment outcome application.
- Build gate: TypeScript + Vite build must pass.

## Known Risks
- Some moment requiredState keys are currently unreachable for scoped characters.
- Phaser bundle size warning due library size.
