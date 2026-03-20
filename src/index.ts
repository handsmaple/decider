// Root entry point — re-exports everything consumers need.
// Import from 'decider/src' (or configure package.json exports) to get a stable surface.

export { deliberate, deliberateStream, selectPanel, DEFAULT_MODEL } from './deliberation/index.js';
export type { DeliberationResult, DeliberationOptions, PersonaResponse, FailedPersona, StreamCallbacks } from './deliberation/index.js';

export { PERSONAS, DIMENSION_LABELS } from './personas/index.js';
export type {
  Persona,
  PersonaDimensions,
  AgeGroup,
  Geography,
  Worldview,
  Interest,
  JobStatus,
  EducationLevel,
} from './personas/index.js';
