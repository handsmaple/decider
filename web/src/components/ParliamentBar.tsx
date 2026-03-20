import type { PersonaEvent } from '../hooks/useDeliberate.ts';

// ── Display labels (mirrors src/personas/types.ts DIMENSION_LABELS) ─

const AGE_LABELS: Record<string, string> = {
  young_adult: '18–25',
  adult: '26–40',
  middle_aged: '41–60',
  senior: '60+',
};

const GEO_LABELS: Record<string, string> = {
  north_american: 'North American',
  european: 'European',
  east_asian: 'East Asian',
  south_asian: 'South Asian',
  latin_american: 'Latin American',
  middle_eastern: 'Middle Eastern',
  african: 'African',
};

const WORLDVIEW_LABELS: Record<string, string> = {
  progressive: 'Progressive',
  conservative: 'Conservative',
  libertarian: 'Libertarian',
  centrist: 'Centrist',
  communitarian: 'Communitarian',
};

const JOB_LABELS: Record<string, string> = {
  student: 'Student',
  corporate_professional: 'Corporate Professional',
  entrepreneur: 'Entrepreneur',
  creative_artist: 'Creative / Artist',
  trades_worker: 'Trades Worker',
  academic_researcher: 'Academic / Researcher',
  retired: 'Retired',
  public_servant: 'Public Servant',
};

const EDUCATION_LABELS: Record<string, string> = {
  high_school: 'High School',
  some_college: 'Some College',
  bachelors: "Bachelor's",
  graduate_professional: 'Graduate / Professional',
};

// ── Color palettes per dimension ────────────────────────────────────

const AGE_COLORS: Record<string, string> = {
  young_adult: '#6EE7B7',
  adult: '#34D399',
  middle_aged: '#059669',
  senior: '#064E3B',
};

const GEO_COLORS: Record<string, string> = {
  north_american: '#93C5FD',
  european: '#60A5FA',
  east_asian: '#3B82F6',
  south_asian: '#2563EB',
  latin_american: '#1D4ED8',
  middle_eastern: '#1E40AF',
  african: '#1E3A8A',
};

const WORLDVIEW_COLORS: Record<string, string> = {
  progressive: '#F472B6',
  conservative: '#FB923C',
  libertarian: '#FBBF24',
  centrist: '#A3A3A3',
  communitarian: '#A78BFA',
};

const JOB_COLORS: Record<string, string> = {
  student: '#FDE68A',
  corporate_professional: '#FCA5A5',
  entrepreneur: '#86EFAC',
  creative_artist: '#C4B5FD',
  trades_worker: '#6EE7B7',
  academic_researcher: '#7DD3FC',
  retired: '#D1D5DB',
  public_servant: '#FCD34D',
};

const EDUCATION_COLORS: Record<string, string> = {
  high_school: '#FED7AA',
  some_college: '#FCA5A5',
  bachelors: '#86EFAC',
  graduate_professional: '#7DD3FC',
};

// ── Sub-components ──────────────────────────────────────────────────

interface SegmentProps {
  label: string;
  color: string;
  count: number;
  total: number;
}

function Segment({ label, color, count, total }: SegmentProps) {
  const pct = (count / total) * 100;
  return (
    <div
      title={`${label} (${count})`}
      style={{
        width: `${pct}%`,
        backgroundColor: color,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'width 0.4s ease',
        minWidth: pct > 0 ? '2px' : '0',
      }}
    >
      {pct >= 12 && (
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', padding: '0 4px' }}>
          {label}
        </span>
      )}
    </div>
  );
}

interface DimensionRowProps {
  label: string;
  counts: Map<string, number>;
  displayLabels: Record<string, string>;
  colors: Record<string, string>;
  total: number;
}

function DimensionRow({ label, counts, displayLabels, colors, total }: DimensionRowProps) {
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', height: '28px', borderRadius: '4px', overflow: 'hidden', background: '#2a2a2a' }}>
        {entries.map(([key, count]) => (
          <Segment
            key={key}
            label={displayLabels[key] ?? key}
            color={colors[key] ?? '#555'}
            count={count}
            total={total}
          />
        ))}
      </div>
    </div>
  );
}

// ── Parliament Bar ──────────────────────────────────────────────────

interface Props {
  personas: PersonaEvent[];
}

export function ParliamentBar({ personas }: Props) {
  if (personas.length === 0) return null;

  const total = personas.length;

  // Count occurrences per dimension value
  const age = new Map<string, number>();
  const geo = new Map<string, number>();
  const worldview = new Map<string, number>();
  const job = new Map<string, number>();
  const education = new Map<string, number>();

  for (const p of personas) {
    const d = p.dimensions;
    age.set(d.age, (age.get(d.age) ?? 0) + 1);
    geo.set(d.geography, (geo.get(d.geography) ?? 0) + 1);
    worldview.set(d.worldview, (worldview.get(d.worldview) ?? 0) + 1);
    job.set(d.job, (job.get(d.job) ?? 0) + 1);
    education.set(d.education, (education.get(d.education) ?? 0) + 1);
  }

  return (
    <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '8px', marginTop: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ccc', marginBottom: '12px' }}>
        Panel composition · {total} {total === 1 ? 'persona' : 'personas'}
      </div>
      <DimensionRow label="Age" counts={age} displayLabels={AGE_LABELS} colors={AGE_COLORS} total={total} />
      <DimensionRow label="Geography" counts={geo} displayLabels={GEO_LABELS} colors={GEO_COLORS} total={total} />
      <DimensionRow label="Worldview" counts={worldview} displayLabels={WORLDVIEW_LABELS} colors={WORLDVIEW_COLORS} total={total} />
      <DimensionRow label="Job" counts={job} displayLabels={JOB_LABELS} colors={JOB_COLORS} total={total} />
      <DimensionRow label="Education" counts={education} displayLabels={EDUCATION_LABELS} colors={EDUCATION_COLORS} total={total} />
    </div>
  );
}
