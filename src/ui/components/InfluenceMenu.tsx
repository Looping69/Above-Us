import { useGameStore } from '../stores/useGameStore';
import { influenceActions } from '../../game/data/influence-actions';

export function InfluenceMenu() {
  const focusedId = useGameStore((s) => s.focusedCharacterId);
  const attention = useGameStore((s) => s.attention);
  const applyAction = useGameStore((s) => s.applyAction);

  if (!focusedId) return null;

  return (
    <div style={styles.menu}>
      <div style={styles.title}>Influence</div>
      {influenceActions.map((action) => {
        const canAfford = attention >= action.cost;
        return (
          <button
            key={action.id}
            style={{ ...styles.btn, ...(canAfford ? {} : styles.btnDisabled) }}
            onClick={() => canAfford && applyAction(action, focusedId)}
            disabled={!canAfford}
            title={action.description}
          >
            <div style={styles.actionName}>{action.name}</div>
            <div style={styles.actionMeta}>
              <span style={styles.costBadge}>⚡{action.cost}</span>
              <span style={styles.alignBadge}>{Object.keys(action.alignment)[0]}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  menu: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 10,
    background: 'rgba(10,10,20,0.9)',
    border: '1px solid #0f3460',
    borderRadius: 10,
    padding: '10px 14px',
    zIndex: 100,
    backdropFilter: 'blur(6px)',
  },
  title: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#0f3460',
    color: '#7ec8e3',
    fontSize: 10,
    padding: '1px 10px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  btn: {
    background: '#0f3460',
    border: '1px solid #1a4a80',
    borderRadius: 8,
    color: '#e0e0e0',
    padding: '8px 12px',
    cursor: 'pointer',
    minWidth: 100,
    textAlign: 'left',
    transition: 'background 0.2s',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  actionName: { fontSize: 13, fontWeight: 600, marginBottom: 4 },
  actionMeta: { display: 'flex', gap: 6 },
  costBadge: { fontSize: 10, color: '#e0a05c', background: '#1a1a00', borderRadius: 4, padding: '1px 5px' },
  alignBadge: { fontSize: 10, color: '#7ec8e3', background: '#0a1a2a', borderRadius: 4, padding: '1px 5px', textTransform: 'capitalize' },
};
