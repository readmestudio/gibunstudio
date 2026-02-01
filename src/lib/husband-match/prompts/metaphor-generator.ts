import { chatCompletion } from '@/lib/openai-client';
import { SYSTEM_PROMPT } from './system-prompt';

/**
 * 성격·관계 컨텍스트를 바탕으로 창의적인 메타포(비유)를 생성합니다.
 */
export async function generateMetaphor(context: string): Promise<string> {
  const prompt = `다음은 사용자의 성격·가치관·관계 스타일 요약입니다.

${context}

위 내용을 바탕으로 "당신과 잘 맞는 파트너와의 관계"를 한 문장의 비유로 표현해주세요.
예: "새로운 세계를 함께 탐험하는 동반자", "고요한 호수처럼 평온함을 주는 존재"
- 한국어로만 작성해주세요.
- 30자 내외의 한 문장만 반환해주세요. 제목이나 번호, 따옴표는 붙이지 마세요.`;

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      {
        model: 'gpt-4-turbo',
        temperature: 0.8,
        max_tokens: 150,
      }
    );

    const text = (response ?? '').trim();
    return text.slice(0, 80); // 최대 80자
  } catch (error) {
    console.error('Metaphor generation failed:', error);
    return '당신과 함께 성장할 파트너';
  }
}
