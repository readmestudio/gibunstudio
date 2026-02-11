import { GoogleGenerativeAI, type Content, type Part } from '@google/generative-ai';

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return _genAI;
}

/** OpenAI 모델명 → Gemini 모델명 자동 변환 */
const MODEL_MAP: Record<string, string> = {
  'gpt-4o-mini': 'gemini-2.0-flash',
  'gpt-4-turbo': 'gemini-1.5-pro',
  'gpt-4o': 'gemini-1.5-pro',
};

function resolveModel(model?: string): string {
  if (!model) return 'gemini-1.5-pro';
  return MODEL_MAP[model] || model;
}

/** 연속 동일 role 메시지를 병합 (Gemini 제약) */
function mergeConsecutiveRoles(contents: Content[]): Content[] {
  if (contents.length === 0) return contents;
  const merged: Content[] = [contents[0]];
  for (let i = 1; i < contents.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = contents[i];
    if (prev.role === curr.role) {
      prev.parts = [...prev.parts, ...curr.parts];
    } else {
      merged.push(curr);
    }
  }
  return merged;
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
  const modelName = resolveModel(options?.model);
  const genAI = getGenAI();

  // system 메시지 분리
  let systemInstruction: string | undefined;
  const nonSystemMessages = messages.filter((m) => {
    if (m.role === 'system') {
      systemInstruction = systemInstruction
        ? `${systemInstruction}\n\n${m.content}`
        : m.content;
      return false;
    }
    return true;
  });

  // OpenAI role → Gemini role 변환
  const contents: Content[] = nonSystemMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const mergedContents = mergeConsecutiveRoles(contents);

  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      ...(options?.max_tokens ? { maxOutputTokens: options.max_tokens } : {}),
      ...(options?.response_format?.type === 'json_object'
        ? { responseMimeType: 'application/json' }
        : {}),
    },
  });

  const result = await model.generateContent({ contents: mergedContents });
  return result.response.text();
}

/** Vision API 이미지 입력 타입 (openai-client.ts와 동일) */
export type VisionImageInput =
  | { type: 'url'; url: string }
  | { type: 'base64'; mediaType: string; data: string };

/**
 * Vision API: 이미지 + 텍스트 프롬프트 → 텍스트 응답
 */
export async function visionCompletion(
  imageInputs: VisionImageInput[],
  textPrompt: string,
  options?: { model?: string; max_tokens?: number }
): Promise<string> {
  const modelName = resolveModel(options?.model);
  const genAI = getGenAI();

  const parts: Part[] = [];

  for (const img of imageInputs) {
    if (img.type === 'base64') {
      parts.push({
        inlineData: {
          mimeType: img.mediaType,
          data: img.data,
        },
      });
    } else {
      // URL 이미지 → fetch 해서 base64 변환
      const res = await fetch(img.url);
      const buf = await res.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');
      const mimeType = res.headers.get('content-type') || 'image/png';
      parts.push({
        inlineData: { mimeType, data: base64 },
      });
    }
  }

  parts.push({ text: textPrompt });

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      ...(options?.max_tokens ? { maxOutputTokens: options.max_tokens } : {}),
    },
  });

  const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
  return result.response.text();
}
