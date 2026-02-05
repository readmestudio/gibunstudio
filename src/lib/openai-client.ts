import OpenAI from 'openai';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' };
  }
) {
  const response = await getOpenAI().chat.completions.create({
    model: options?.model || 'gpt-4-turbo',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens,
    response_format: options?.response_format,
  });

  return response.choices[0].message.content;
}

/** Image content for Vision API: base64 data URL or URL */
export type VisionImageInput = { type: 'url'; url: string } | { type: 'base64'; mediaType: string; data: string };

/**
 * Vision API: send image(s) + text prompt, get text response.
 * Used to extract channel names from YouTube subscription screenshot(s).
 */
export async function visionCompletion(
  imageInputs: VisionImageInput[],
  textPrompt: string,
  options?: { model?: string; max_tokens?: number }
): Promise<string> {
  const content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];

  for (const img of imageInputs) {
    if (img.type === 'url') {
      content.push({ type: 'image_url', image_url: { url: img.url } });
    } else {
      const url = `data:${img.mediaType};base64,${img.data}`;
      content.push({ type: 'image_url', image_url: { url } });
    }
  }
  content.push({ type: 'text', text: textPrompt });

  const response = await getOpenAI().chat.completions.create({
    model: options?.model || 'gpt-4o',
    messages: [{ role: 'user', content }],
    max_tokens: options?.max_tokens ?? 1024,
  });

  return response.choices[0].message.content ?? '';
}
