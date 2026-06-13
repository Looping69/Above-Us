import { useGameStore } from '../stores/useGameStore';
import { getDominantAlignment } from '../../game/systems/alignment-system';

function formatSaveTime(ts: number | null): string {
  if (ts === null) return 'Not saved';
  const d = new Date(ts);
  return `Saved ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

export function HUD() {
  const alignment = useGameStore((s) => s.alignment);
  const attention = useGameStore((s) => s.attention);
  const maxAttention = useGameStore((s) => s.maxAttention);
  const feedback = useGameStore((s) => s.lastInfluenceFeedback);
  const lastSavedAt = useGameStore((s) => s.lastSavedAt);
  const adultContentEnabled = useGameStore((s) => s.adultContentEnabled);
  const setAdultContentEnabled = useGameStore((s) => s.setAdultContentEnabled);
  const resetGame = useGameStore((s) => s.resetGame);
  const dominant = getDominantAlignment(alignment);

  return (
    <div style={styles.hud}>
      <div style={styles.section}>
        <span style={styles.label}>Identity</span>
        <span style={styles.value}>{dominant}</span>
      </div>
      <div style={styles.section}>
        <span style={styles.label}>Attention</span>
        <div style={styles.attentionBar}>
          {Array.from({ length: maxAttention }).map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.pip,
                background: i < attention ? '#e0a05c' : '#1a1a2e',
              }}
            />
          ))}
        </div>
      </div>
      <label style={styles.toggleRow}>
        <span style={styles.label}>18+ Scenes</span>
        <input
          type="checkbox"
          checked={adultContentEnabled}
          onChange={(event) => setAdultContentEnabled(event.currentTarget.checked)}
        />
      </label>
      <div style={styles.alignmentRow}>
        {(['manipulator', 'guardian', 'tempter', 'creator'] as const).map((k) => (
          <div key={k} style={styles.alignItem}>
            <span style={styles.alignLabel}>{k[0].toUpperCase()}</span>
            <span style={styles.alignVal}>{alignment[k]}</span>
          </div>
        ))}
      </div>
      {feedback && <div style={styles.feedback}>{feedback}</div>}
      <div style={styles.footer}>
        <span style={styles.saveLabel}>{formatSaveTime(lastSavedAt)}</span>
        <button
          style={styles.resetBtn}
          onClick={() => {
            if (window.confirm('Reset all progress?')) resetGame();
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hud: {
    position: 'fixed',
    top: 12,
    left: 12,
    background: 'rgba(10,10,20,0.85)',
    border: '1px solid #0f3460',
    borderRadius: 8,
    padding: '10px 16px',
    color: '#e0e0e0',
    fontSize: 13,
    zIndex: 100,
    minWidth: 200,
    backdropFilter: 'blur(6px)',
  },
  section: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  value: { color: '#e0a05c', fontWeight: 700 },
  attentionBar: { display: 'flex', gap: 3, marginTop: 2 },
  pip: { width: 12, height: 12, borderRadius: 3, border: '1px solid #0f3460', transition: 'background 0.3s' },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderTop: '1px solid #0f3460', paddingTop: 6, marginTop: 6, cursor: 'pointer',
  },
  alignmentRow: { display: 'flex', gap: 10, marginTop: 8 },
  alignItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  alignLabel: { fontSize: 9, color: '#555', textTransform: 'uppercase' },
  alignVal: { fontSize: 14, color: '#7ec8e3', fontWeight: 700 },
  feedback: { marginTop: 8, fontSize: 11, color: '#bbb', fontStyle: 'italic', borderTop: '1px solid #0f3460', paddingTop: 6 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '1px solid #0f3460', paddingTop: 6 },
  saveLabel: { fontSize: 10, color: '#444' },
  resetBtn: {
    background: 'none', border: '1px solid #2a1a1a', borderRadius: 4,
    color: '#774444', fontSize: 10, padding: '2px 8px', cursor: 'pointer',
  },
};
