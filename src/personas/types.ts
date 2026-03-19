// ── Dimension Value Types ──────────────────────────────────────────

export type AgeGroup = 'young_adult' | 'adult' | 'middle_aged' | 'senior';

export type Geography =
  | 'north_american'
  | 'european'
  | 'east_asian'
  | 'south_asian'
  | 'latin_american'
  | 'middle_eastern'
  | 'african';

export type Worldview =
  | 'progressive'
  | 'conservative'
  | 'libertarian'
  | 'centrist'
  | 'communitarian';

export type Interest =
  | 'technology'
  | 'arts_culture'
  | 'sports_fitness'
  | 'nature_environment'
  | 'business_finance'
  | 'science'
  | 'spirituality'
  | 'family_community';

export type JobStatus =
  | 'student'
  | 'corporate_professional'
  | 'entrepreneur'
  | 'creative_artist'
  | 'trades_worker'
  | 'academic_researcher'
  | 'retired'
  | 'public_servant';

export type EducationLevel =
  | 'high_school'
  | 'some_college'
  | 'bachelors'
  | 'graduate_professional';

// ── Persona Definition ─────────────────────────────────────────────

export interface PersonaDimensions {
  age: AgeGroup;
  geography: Geography;
  worldview: Worldview;
  interests: [Interest] | [Interest, Interest]; // 1–2 interests
  job: JobStatus;
  education: EducationLevel;
}

export interface Persona {
  id: string;
  label: string;
  dimensions: PersonaDimensions;
}

// ── Dimension Metadata (for UI labels, distribution tracking, etc.) ─

export const AGE_GROUPS: readonly AgeGroup[] = [
  'young_adult',
  'adult',
  'middle_aged',
  'senior',
] as const;

export const GEOGRAPHIES: readonly Geography[] = [
  'north_american',
  'european',
  'east_asian',
  'south_asian',
  'latin_american',
  'middle_eastern',
  'african',
] as const;

export const WORLDVIEWS: readonly Worldview[] = [
  'progressive',
  'conservative',
  'libertarian',
  'centrist',
  'communitarian',
] as const;

export const INTERESTS: readonly Interest[] = [
  'technology',
  'arts_culture',
  'sports_fitness',
  'nature_environment',
  'business_finance',
  'science',
  'spirituality',
  'family_community',
] as const;

export const JOB_STATUSES: readonly JobStatus[] = [
  'student',
  'corporate_professional',
  'entrepreneur',
  'creative_artist',
  'trades_worker',
  'academic_researcher',
  'retired',
  'public_servant',
] as const;

export const EDUCATION_LEVELS: readonly EducationLevel[] = [
  'high_school',
  'some_college',
  'bachelors',
  'graduate_professional',
] as const;

// ── Display Labels ──────────────────────────────────────────────────

export const DIMENSION_LABELS: Record<string, Record<string, string>> = {
  age: {
    young_adult: '18–25',
    adult: '26–40',
    middle_aged: '41–60',
    senior: '60+',
  },
  geography: {
    north_american: 'North American',
    european: 'European',
    east_asian: 'East Asian',
    south_asian: 'South Asian',
    latin_american: 'Latin American',
    middle_eastern: 'Middle Eastern',
    african: 'African',
  },
  worldview: {
    progressive: 'Progressive',
    conservative: 'Conservative',
    libertarian: 'Libertarian',
    centrist: 'Centrist',
    communitarian: 'Communitarian',
  },
  interests: {
    technology: 'Technology',
    arts_culture: 'Arts & Culture',
    sports_fitness: 'Sports & Fitness',
    nature_environment: 'Nature & Environment',
    business_finance: 'Business & Finance',
    science: 'Science',
    spirituality: 'Spirituality',
    family_community: 'Family & Community',
  },
  job: {
    student: 'Student',
    corporate_professional: 'Corporate Professional',
    entrepreneur: 'Entrepreneur',
    creative_artist: 'Creative / Artist',
    trades_worker: 'Trades Worker',
    academic_researcher: 'Academic / Researcher',
    retired: 'Retired',
    public_servant: 'Public Servant',
  },
  education: {
    high_school: 'High School',
    some_college: 'Some College',
    bachelors: "Bachelor's",
    graduate_professional: 'Graduate / Professional',
  },
};
