import { useEffect, useRef } from 'react';
import { createPhaserGame } from '../game/PhaserGame';
import { HUD } from '../ui/components/HUD';
import { CharacterPanel } from '../ui/components/CharacterPanel';
import { InfluenceMenu } from '../ui/components/InfluenceMenu';
import { MomentPanel } from '../ui/components/MomentPanel';
import type Phaser from 'phaser';

export function App() {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserRef.current) return;
    phaserRef.current = createPhaserGame(gameRef.current);

    return () => {
      phaserRef.current?.destroy(true);
      phaserRef.current = null;
    };
  }, []);

  return (
    <>
      <div ref={gameRef} style={{ position: 'fixed', inset: 0 }} />
      <HUD />
      <CharacterPanel />
      <InfluenceMenu />
      <MomentPanel />
    </>
  );
}
