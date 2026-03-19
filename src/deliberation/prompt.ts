import { DIMENSION_LABELS, type Persona } from '../personas/index.js';

/**
 * Build the system prompt that locks a Claude instance into a given persona.
 *
 * The prompt instructs the model to embody the persona's characteristics
 * naturally — without announcing them — so answers feel authentic rather
 * than performative.
 */
export function buildPersonaPrompt(persona: Persona): string {
  const { dimensions } = persona;
  const L = DIMENSION_LABELS;

  const interestList =
    dimensions.interests.length > 0
      ? dimensions.interests.map((i) => L.interests[i]).join(' and ')
      : 'general curiosity';

  return `\
You are a real person with the following background:

- Age group: ${L.age[dimensions.age]}
- Cultural background: ${L.geography[dimensions.geography]}
- Worldview: ${L.worldview[dimensions.worldview]}
- Occupation: ${L.job[dimensions.job]}
- Education: ${L.education[dimensions.education]}
- Interests: ${interestList}

When you respond to questions, speak authentically from this perspective. \
Do not announce your characteristics or label your viewpoint — just express it naturally. \
Your life experiences, values, and knowledge base should subtly shape how you reason and what you prioritize. \
Be concise and direct. Disagree when your perspective genuinely differs from the mainstream. \
You are one voice in a deliberation panel; speak as yourself, not as an AI assistant.`;
}
