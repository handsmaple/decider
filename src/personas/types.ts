// ── Dimension Value Arrays (source of truth) ───────────────────────
// Types are derived from arrays — edit the array, the type updates automatically.

export const AGE_GROUPS = [
  'young_adult',
  'adult',
  'middle_aged',
  'senior',
] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export const GEOGRAPHIES = [
  'north_american',
  'european',
  'east_asian',
  'south_asian',
  'latin_american',
  'middle_eastern',
  'african',
] as const;
export type Geography = (typeof GEOGRAPHIES)[number];

export const WORLDVIEWS = [
  'progressive',
  'conservative',
  'libertarian',
  'centrist',
  'communitarian',
] as const;
export type Worldview = (typeof WORLDVIEWS)[number];

export const INTERESTS = [
  'technology',
  'arts_culture',
  'sports_fitness',
  'nature_environment',
  'business_finance',
  'science',
  'spirituality',
  'family_community',
] as const;
export type Interest = (typeof INTERESTS)[number];

export const JOB_STATUSES = [
  'student',
  'corporate_professional',
  'entrepreneur',
  'creative_artist',
  'trades_worker',
  'academic_researcher',
  'retired',
  'public_servant',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const EDUCATION_LEVELS = [
  'high_school',
  'some_college',
  'bachelors',
  'graduate_professional',
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

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

// ── Display Labels ──────────────────────────────────────────────────
// Typed as a mapped object — adding a new union member without a label is a compile error.

type DimensionLabels = {
  age: Record<AgeGroup, string>;
  geography: Record<Geography, string>;
  worldview: Record<Worldview, string>;
  interests: Record<Interest, string>;
  job: Record<JobStatus, string>;
  education: Record<EducationLevel, string>;
};

export const DIMENSION_LABELS: DimensionLabels = {
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
