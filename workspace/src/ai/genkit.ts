
import * as genkitCore from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';

// Handle potential module resolution issues.
const genkit = (genkitCore as any).genkit || (genkitCore as any).default;

if (!genkit) {
  throw new Error('Could not find genkit function in @genkit-ai/core. Your Genkit installation might be corrupted.');
}

export const ai = genkit({
  plugins: [googleAI({
    apiKey: process.env.GEMINI_API_KEY,
  })],
});
 