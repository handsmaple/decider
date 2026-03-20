import { Platform } from 'react-native';

// Development defaults:
//   iOS simulator  → localhost resolves to the host machine
//   Android emu    → 10.0.2.2 resolves to the host machine
//   Physical device → set EXPO_PUBLIC_API_URL to your LAN IP, e.g. http://192.168.1.x:3000
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL =
  process.env['EXPO_PUBLIC_API_URL'] ?? `http://${DEV_HOST}:3000`;

// ── Display labels (mirrored from src/personas/types.ts) ─────────────

export const AGE_LABELS: Record<string, string> = {
  young_adult: '18–25',
  adult: '26–40',
  middle_aged: '41–60',
  senior: '60+',
};

export const GEOGRAPHY_LABELS: Record<string, string> = {
  north_american: 'N. American',
  european: 'European',
  east_asian: 'E. Asian',
  south_asian: 'S. Asian',
  latin_american: 'Latin American',
  middle_eastern: 'Middle Eastern',
  african: 'African',
};

export const WORLDVIEW_LABELS: Record<string, string> = {
  progressive: 'Progressive',
  conservative: 'Conservative',
  libertarian: 'Libertarian',
  centrist: 'Centrist',
  communitarian: 'Communitarian',
};

export const JOB_LABELS: Record<string, string> = {
  student: 'Student',
  corporate_professional: 'Corporate Professional',
  entrepreneur: 'Entrepreneur',
  creative_artist: 'Creative / Artist',
  trades_worker: 'Trades Worker',
  academic_researcher: 'Academic / Researcher',
  retired: 'Retired',
  public_servant: 'Public Servant',
};

export const EDUCATION_LABELS: Record<string, string> = {
  high_school: 'High School',
  some_college: 'Some College',
  bachelors: "Bachelor's",
  graduate_professional: 'Graduate / Professional',
};

export const INTEREST_LABELS: Record<string, string> = {
  technology: 'Technology',
  arts_culture: 'Arts & Culture',
  sports_fitness: 'Sports & Fitness',
  nature_environment: 'Nature & Environment',
  business_finance: 'Business & Finance',
  science: 'Science',
  spirituality: 'Spirituality',
  family_community: 'Family & Community',
};

// ── Worldview colours (used by ParliamentBar and DimensionBreakdown) ─

export const WORLDVIEW_COLORS: Record<string, string> = {
  progressive: '#22c55e',
  conservative: '#ef4444',
  libertarian: '#f59e0b',
  centrist: '#3b82f6',
  communitarian: '#a855f7',
};

export function worldviewColor(worldview: string): string {
  return WORLDVIEW_COLORS[worldview] ?? '#6b7280';
}

export function label(map: Record<string, string>, key: string): string {
  return map[key] ?? key.replace(/_/g, ' ');
}
