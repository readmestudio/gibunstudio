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
  'gpt-4o-mini': 'gemini-2.5-flash',
  'gpt-4-turbo': 'gemini-2.5-pro',
  'gpt-4o': 'gemini-2.5-pro',
};

function resolveModel(model?: string): string {
  if (!model) return 'gemini-2.5-pro';
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

/**
 * Gemini 2.5 모델이 JSON 문자열 값 안에 제어 문자(줄바꿈 등)를
 * 이스케이프 없이 넣거나, 출력이 중간에 잘리는 문제를 해결하는 안전한 JSON 파서.
 *
 * 복구 전략 (3단계):
 * 1. 그대로 파싱 시도
 * 2. 제어 문자 이스케이프 후 파싱
 * 3. 잘린 JSON 구조를 닫은 후 파싱
 */
export function safeJsonParse<T = Record<string, string>>(text: string): T {
  // 1단계: 그대로 시도
  try {
    return JSON.parse(text);
  } catch {
    // 계속
  }

  // 2단계: 제어 문자 이스케이프
  const sanitized = escapeControlCharsInStrings(text);
  try {
    return JSON.parse(sanitized);
  } catch {
    // 계속
  }

  // 3단계: 잘린 JSON 복구 시도
  const repaired = repairTruncatedJson(sanitized);
  try {
    return JSON.parse(repaired);
  } catch (err) {
    console.error('[safeJsonParse] 모든 복구 실패, 원본 길이:', text.length, '에러:', (err as Error).message);
    // 최후의 수단: 빈 객체 반환보다는 에러를 던져서 재시도 로직이 작동하게 함
    throw err;
  }
}

/** JSON 문자열 값 안의 제어 문자를 이스케이프 처리 */
function escapeControlCharsInStrings(text: string): string {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = text.charCodeAt(i);

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && code <= 0x1f) {
      switch (code) {
        case 0x0a: result += '\\n'; break;
        case 0x0d: result += '\\r'; break;
        case 0x09: result += '\\t'; break;
        default: result += `\\u${code.toString(16).padStart(4, '0')}`;
      }
    } else {
      result += ch;
    }
  }

  return result;
}

/**
 * 잘린 JSON을 복구 — 모델이 max_tokens에 도달해 출력이 중간에 끊겼을 때.
 * 열린 문자열/배열/객체를 닫아서 유효한 JSON으로 만든다.
 */
function repairTruncatedJson(text: string): string {
  // JSON 시작 위치 찾기
  const jsonStart = text.indexOf('{');
  if (jsonStart === -1) return text;

  let s = text.slice(jsonStart);

  // 스택 기반으로 열린 구조 추적
  let inString = false;
  let escaped = false;
  const stack: string[] = []; // '{' or '['
  let lastStringStart = -1;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      if (inString) {
        inString = false;
      } else {
        inString = true;
        lastStringStart = i;
      }
      continue;
    }

    if (!inString) {
      if (ch === '{') stack.push('{');
      else if (ch === '[') stack.push('[');
      else if (ch === '}') { if (stack.length > 0 && stack[stack.length - 1] === '{') stack.pop(); }
      else if (ch === ']') { if (stack.length > 0 && stack[stack.length - 1] === '[') stack.pop(); }
    }
  }

  // 열린 문자열이 있으면 닫기
  if (inString) {
    s += '"';
  }

  // 열린 구조 닫기 (역순으로)
  while (stack.length > 0) {
    const open = stack.pop();
    s += open === '{' ? '}' : ']';
  }

  return s;
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
