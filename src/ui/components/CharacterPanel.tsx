import { useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { momentEvents } from '../../game/data/moment-events';
import { momentArcs } from '../../game/data/moment-arcs';
import { getAvailableMoments } from '../../game/systems/moment-system';
import type { MomentEvent } from '../../game/types/moment';
import type { CharacterConnection } from '../../game/types/character';
import type { PlayerAlignment } from '../../game/types/alignment';

type LockHint = {
  label: string;
  category: 'connection' | 'alignment' | 'state';
};

function formatRequirementName(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function getLockHintsForMoment(
  moment: MomentEvent,
  connection: CharacterConnection,
  alignment: PlayerAlignment,
  state: Record<string, number>
): LockHint[] {
  const hints: LockHint[] = [];
  const req = moment.requirements;

  if (req.minTrust !== undefined && connection.trust < req.minTrust) {
    hints.push({ label: `Trust ${connection.trust}/${req.minTrust}`, category: 'connection' });
  }
  if (req.minCuriosity !== undefined && connection.curiosity < req.minCuriosity) {
    hints.push({ label: `Curiosity ${connection.curiosity}/${req.minCuriosity}`, category: 'connection' });
  }
  if (req.minComfort !== undefined && connection.comfort < req.minComfort) {
    hints.push({ label: `Comfort ${connection.comfort}/${req.minComfort}`, category: 'connection' });
  }
  if (req.maxResistance !== undefined && connection.resistance > req.maxResistance) {
    hints.push({ label: `Resistance ${connection.resistance}/${req.maxResistance} max`, category: 'connection' });
  }

  if (req.minAlignment) {
    for (const [key, min] of Object.entries(req.minAlignment)) {
      const current = alignment[key as keyof PlayerAlignment] ?? 0;
      if (current < (min ?? 0)) {
        hints.push({ label: `${formatRequirementName(key)} ${current}/${min}`, category: 'alignment' });
      }
    }
  }

  if (req.requiredState) {
    for (const [key, min] of Object.entries(req.requiredState)) {
      const current = state[key] ?? 0;
      if (current < min) {
        hints.push({ label: `${formatRequirementName(key)} ${current}/${min}`, category: 'state' });
      }
    }
  }

  return hints;
}

const connectionKeys = ['trust', 'curiosity', 'dependence', 'attraction', 'comfort', 'resistance'] as const;
const connectionColors: Record<string, string> = {
  trust: '#7ec87e',
  curiosity: '#5cb8e0',
  dependence: '#e0a05c',
  attraction: '#e05c7c',
  comfort: '#a0c8a0',
  resistance: '#e07070',
};

type SectionKey = 'connection' | 'state' | 'desires' | 'fears' | 'evolution' | 'arcs';

export function CharacterPanel() {
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    connection: true,
    state: false,
    desires: false,
    fears: false,
    evolution: false,
    arcs: true,
  });

  const toggle = (key: SectionKey) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const characters = useGameStore((s) => s.characters);
  const focusedId = useGameStore((s) => s.focusedCharacterId);
  const connections = useGameStore((s) => s.connections);
  const characterStates = useGameStore((s) => s.characterStates);
  const alignment = useGameStore((s) => s.alignment);
  const triggeredMoments = useGameStore((s) => s.triggeredMoments);
  const evolutionByCharacter = useGameStore((s) => s.evolutionByCharacter);
  const selectCharacter = useGameStore((s) => s.selectCharacter);

  const selected = focusedId ? characters.find((c) => c.id === focusedId) : null;
  const connection = focusedId ? connections[focusedId] : null;
  const state = focusedId ? characterStates[focusedId] : null;
  const evolution = focusedId ? evolutionByCharacter[focusedId] : null;

  if (!selected || !connection || !state) {
    return (
      <div style={styles.panel}>
        <p style={styles.hint}>Click a character to inspect them.</p>
      </div>
    );
  }

  const scopedMoments = momentEvents.filter(
    (m) => !m.characterIds || m.characterIds.includes(selected.id)
  );
  const availableNow = getAvailableMoments(
    momentEvents,
    triggeredMoments,
    connection,
    alignment,
    state,
    selected.id
  );

  const arcStats = Object.entries(
    scopedMoments.reduce<Record<string, { totalStages: number; triggeredStages: number; nextStage?: number }>>(
      (acc, moment) => {
        const current = acc[moment.arcId] ?? { totalStages: 0, triggeredStages: 0, nextStage: undefined };
        current.totalStages += 1;
        if (triggeredMoments.has(moment.id)) {
          current.triggeredStages += 1;
        } else {
          current.nextStage = current.nextStage === undefined ? moment.stage : Math.min(current.nextStage, moment.stage);
        }
        acc[moment.arcId] = current;
        return acc;
      },
      {}
    )
  )
    .map(([arcId, stats]) => {
      const nextMoment =
        stats.nextStage === undefined
          ? undefined
          : scopedMoments
              .filter((m) => m.arcId === arcId && m.stage === stats.nextStage && !triggeredMoments.has(m.id))
              .sort((a, b) => a.id.localeCompare(b.id))[0];

      const readyNow =
        stats.nextStage !== undefined &&
        availableNow.some((m) => m.arcId === arcId && m.stage === stats.nextStage);

      const lockHints =
        !readyNow && nextMoment
          ? getLockHintsForMoment(nextMoment, connection, alignment, state)
          : [];

      return {
        arcId,
        arc: momentArcs[arcId],
        ...stats,
        readyNow,
        lockHints,
      };
    })
    .sort((a, b) => a.arcId.localeCompare(b.arcId));

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <button style={styles.close} onClick={() => selectCharacter(null)}>✕</button>
        <div style={{ ...styles.colorDot, background: `#${selected.color.toString(16).padStart(6, '0')}` }} />
        <div>
          <div style={styles.name}>{selected.name}</div>
          <div style={styles.role}>{selected.role}</div>
        </div>
      </div>

      <div style={styles.archetype}>{selected.archetype} · {selected.primaryTension}</div>

      <button style={styles.sectionToggle} onClick={() => toggle('connection')}>
        <span>Connection</span><span style={styles.chevron}>{open.connection ? '▾' : '▸'}</span>
      </button>
      {open.connection && connectionKeys.map((k) => (
        <div key={k} style={styles.barRow}>
          <span style={styles.barLabel}>{k}</span>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${(connection[k] / 10) * 100}%`, background: connectionColors[k] ?? '#7ec8e3' }} />
          </div>
          <span style={styles.barVal}>{connection[k]}</span>
        </div>
      ))}

      <button style={styles.sectionToggle} onClick={() => toggle('state')}>
        <span>State</span><span style={styles.chevron}>{open.state ? '▾' : '▸'}</span>
      </button>
      {open.state && Object.entries(state).map(([k, v]) => (
        <div key={k} style={styles.barRow}>
          <span style={styles.barLabel}>{k}</span>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${(v / 10) * 100}%`, background: '#7ec8e3' }} />
          </div>
          <span style={styles.barVal}>{v}</span>
        </div>
      ))}

      <button style={styles.sectionToggle} onClick={() => toggle('desires')}>
        <span>Desires</span><span style={styles.chevron}>{open.desires ? '▾' : '▸'}</span>
      </button>
      {open.desires && <div style={styles.tags}>{selected.desires.map((d: string) => <span key={d} style={styles.tag}>{d}</span>)}</div>}

      <button style={styles.sectionToggle} onClick={() => toggle('fears')}>
        <span>Fears</span><span style={styles.chevron}>{open.fears ? '▾' : '▸'}</span>
      </button>
      {open.fears && <div style={styles.tags}>{selected.fears.map((f: string) => <span key={f} style={{ ...styles.tag, background: '#2a1a1a', color: '#e07070' }}>{f}</span>)}</div>}

      <button style={styles.sectionToggle} onClick={() => toggle('evolution')}>
        <span>Evolution Paths</span><span style={styles.chevron}>{open.evolution ? '▾' : '▸'}</span>
      </button>
      {open.evolution && (
        <div>
          <div style={styles.evoMetaRow}>
            <span style={styles.evoMetaLabel}>Dominant</span>
            <span style={styles.evoMetaValue}>{evolution?.dominantPath ?? 'None'}</span>
          </div>
          <div style={styles.evoMetaRow}>
            <span style={styles.evoMetaLabel}>Evolved</span>
            <span style={styles.evoMetaValue}>{evolution?.evolvedPath ?? 'Not yet'}</span>
          </div>
          {selected.evolutionPaths.map((path: string) => {
            const score = evolution?.pathScores[path] ?? 0;
            const isEvolved = evolution?.evolvedPath === path;
            return (
              <div key={path} style={styles.barRow}>
                <span style={styles.barLabel}>{path}</span>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${Math.min(100, score * 10)}%`,
                      background: isEvolved ? '#7ec87e' : '#a05ce0',
                    }}
                  />
                </div>
                <span style={styles.barVal}>{score}</span>
              </div>
            );
          })}
        </div>
      )}

      <button style={styles.sectionToggle} onClick={() => toggle('arcs')}>
        <span>Arc Progress</span><span style={styles.chevron}>{open.arcs ? '▾' : '▸'}</span>
      </button>
      {open.arcs && <div style={styles.chipLegend}>
        <span style={{ ...styles.lockHintChip, ...styles.lockHintConnection }}>connection</span>
        <span style={{ ...styles.lockHintChip, ...styles.lockHintAlignment }}>alignment</span>
        <span style={{ ...styles.lockHintChip, ...styles.lockHintState }}>state</span>
      </div>}
      {open.arcs && arcStats.map((arc) => (
        <div key={arc.arcId} style={styles.arcRow}>
          <div style={styles.arcHeaderRow}>
            <span style={styles.arcName}>{arc.arc?.title ?? arc.arcId.replace(/_/g, ' ')}</span>
            <div style={styles.arcHeaderRight}>
              {arc.readyNow && arc.nextStage !== undefined ? <span style={styles.readyBadge}>Ready</span> : null}
              <span style={styles.arcMeta}>{arc.triggeredStages}/{arc.totalStages}</span>
            </div>
          </div>
          {arc.arc?.description ? <div style={styles.arcDescription}>{arc.arc.description}</div> : null}
          <div style={styles.barTrack}>
            <div
              style={{
                ...styles.barFill,
                width: `${(arc.triggeredStages / Math.max(arc.totalStages, 1)) * 100}%`,
                background: arc.readyNow ? arc.arc?.accentColor ?? '#7ec87e' : '#5c7aa0',
              }}
            />
          </div>
          <div style={styles.arcStatus}>
            {arc.nextStage === undefined
              ? 'Completed'
              : arc.readyNow
                ? `Next stage ${arc.nextStage} ready`
                : `Next stage ${arc.nextStage} locked`}
          </div>
          {!arc.readyNow && arc.nextStage !== undefined && arc.lockHints.length > 0 ? (
            <div>
              <div style={styles.lockHint}>Needs:</div>
              <div style={styles.lockHintsWrap}>
                {arc.lockHints.map((hint) => (
                  <span
                    key={hint.label}
                    style={{
                      ...styles.lockHintChip,
                      ...(hint.category === 'connection'
                        ? styles.lockHintConnection
                        : hint.category === 'alignment'
                          ? styles.lockHintAlignment
                          : styles.lockHintState),
                    }}
                  >
                    {hint.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    right: 12,
    top: 12,
    width: 260,
    maxHeight: 'calc(100vh - 24px)',
    overflowY: 'auto',
    background: 'rgba(10,10,20,0.9)',
    border: '1px solid #0f3460',
    borderRadius: 8,
    padding: '12px 14px',
    color: '#e0e0e0',
    fontSize: 12,
    zIndex: 100,
    backdropFilter: 'blur(6px)',
  },
  hint: { color: '#555', fontStyle: 'italic', textAlign: 'center', paddingTop: 20 },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  close: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, marginLeft: 'auto', order: 3 },
  colorDot: { width: 24, height: 24, borderRadius: '50%', flexShrink: 0 },
  name: { fontWeight: 700, fontSize: 16, color: '#fff' },
  role: { color: '#888', fontSize: 11 },
  archetype: { color: '#e0a05c', fontSize: 11, marginBottom: 10, fontStyle: 'italic' },
  sectionTitle: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#555', borderTop: '1px solid #1a1a2e', paddingTop: 8, marginTop: 8, marginBottom: 6 },
  sectionToggle: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', background: 'none', border: 'none',
    borderTop: '1px solid #1a1a2e', paddingTop: 8, marginTop: 8, marginBottom: 6,
    cursor: 'pointer', color: '#555', fontSize: 10, textTransform: 'uppercase' as const,
    letterSpacing: 1, padding: '6px 0',
  },
  chevron: { color: '#444', fontSize: 10 },
  chipLegend: { display: 'flex', gap: 6, marginBottom: 8 },
  barRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  barLabel: { width: 80, color: '#999', fontSize: 11, textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 6, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, transition: 'width 0.4s ease' },
  barVal: { width: 16, textAlign: 'right', color: '#ccc', fontSize: 11 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  tag: { background: '#1a2a1a', color: '#7ec87e', borderRadius: 4, padding: '2px 7px', fontSize: 10 },
  arcRow: { marginBottom: 8 },
  arcHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  arcHeaderRight: { display: 'flex', alignItems: 'center', gap: 6 },
  arcName: { color: '#b0b8d8', textTransform: 'capitalize', fontSize: 11 },
  arcDescription: { color: '#7f87a8', fontSize: 10, marginBottom: 4 },
  arcMeta: { color: '#888', fontSize: 10 },
  readyBadge: {
    color: '#102010',
    background: '#7ec87e',
    borderRadius: 10,
    fontSize: 9,
    padding: '1px 6px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arcStatus: { color: '#8892b0', fontSize: 10, marginTop: 3 },
  lockHint: { color: '#d0b080', fontSize: 10, marginTop: 2 },
  lockHintsWrap: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  lockHintChip: {
    borderRadius: 10,
    fontSize: 9,
    padding: '2px 7px',
    border: '1px solid transparent',
    lineHeight: 1.2,
  },
  lockHintConnection: { color: '#cfe6ff', background: '#17324d', borderColor: '#315d8a' },
  lockHintAlignment: { color: '#ffe3b3', background: '#4a3518', borderColor: '#8a6230' },
  lockHintState: { color: '#d4f8d4', background: '#183a25', borderColor: '#2f7a4e' },
  evoMetaRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  evoMetaLabel: { color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  evoMetaValue: { color: '#c6c8e3', fontSize: 11, fontWeight: 700 },
};
