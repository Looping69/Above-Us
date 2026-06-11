import { useGameStore } from '../stores/useGameStore';

const toneColors: Record<string, string> = {
  emotional: '#7ec8e3',
  romantic: '#e05c7c',
  dramatic: '#e0a05c',
  seductive: '#a05ce0',
  conflict: '#e07070',
  revelation: '#7ec87e',
};

export function MomentPanel() {
  const moment = useGameStore((s) => s.activeMoment);
  const dismiss = useGameStore((s) => s.dismissMoment);

  if (!moment) return null;

  const toneColor = toneColors[moment.tone] ?? '#7ec8e3';

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={{ ...styles.toneBadge, background: toneColor + '22', color: toneColor, border: `1px solid ${toneColor}44` }}>
          {moment.tone}
        </div>
        <h2 style={styles.title}>{moment.title}</h2>
        <p style={styles.description}>{moment.description}</p>
        <div style={styles.divider} />
        <p style={styles.outcome}>{moment.outcome.description}</p>
        <button style={{ ...styles.btn, borderColor: toneColor, color: toneColor }} onClick={dismiss}>
          Continue
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    backdropFilter: 'blur(4px)',
  },
  panel: {
    background: '#0a0a1a',
    border: '1px solid #0f3460',
    borderRadius: 12,
    padding: '28px 32px',
    maxWidth: 460,
    width: '90%',
    color: '#e0e0e0',
    textAlign: 'center',
    boxShadow: '0 0 60px rgba(15,52,96,0.6)',
  },
  toneBadge: {
    display: 'inline-block',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    borderRadius: 4,
    padding: '2px 10px',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 14, color: '#fff' },
  description: { fontSize: 14, lineHeight: 1.7, color: '#bbb', marginBottom: 18, fontStyle: 'italic' },
  divider: { height: 1, background: '#0f3460', margin: '0 0 18px' },
  outcome: { fontSize: 13, color: '#888', marginBottom: 24 },
  btn: {
    background: 'transparent',
    border: '1px solid',
    borderRadius: 6,
    padding: '8px 28px',
    fontSize: 13,
    cursor: 'pointer',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};
