
'use server';
/**
 * @fileOverview An AI flow for generating cartoon-style avatars for children.
 *
 * - generateAvatar - A function that generates an avatar from a text prompt.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateAvatarInputSchema = z.object({
  prompt: z.string().describe('A text description of the avatar to generate.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated avatar image. Format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  try {
    return await generateAvatarFlow(input);
  } catch (error) {
    console.error("Error generating avatar:", error);
    throw error;
  }
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async ({ prompt }: GenerateAvatarInput) => {
    try {
      const fullPrompt = `A cute, cartoon-style avatar for a child's chore app. The avatar should be friendly and simple. Style: ${prompt}`;

      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: fullPrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('Image generation failed to produce an output.');
      }

      return { imageUrl: media.url };
    } catch (error) {
      console.error("Error in generateAvatarFlow execution:", error);
      throw error;
    }
  }
);
 