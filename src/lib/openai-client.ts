import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' };
  }
) {
  const response = await openai.chat.completions.create({
    model: options?.model || 'gpt-4-turbo',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens,
    response_format: options?.response_format,
  });

  return response.choices[0].message.content;
}
