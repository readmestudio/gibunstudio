import { chatCompletion } from '@/lib/gemini-client';
import { SYSTEM_PROMPT } from './system-prompt';

/**
 * 성격·관계 컨텍스트를 바탕으로 창의적인 메타포(비유)를 생성합니다.
 */
export async function generateMetaphor(context: string): Promise<string> {
  const prompt = `다음은 사용자의 성격·가치관·관계 스타일 요약입니다.

${context}

위 내용을 바탕으로 "이 사람 옆에 있으면 어떤 느낌인지"를 감각적이고 일상적인 비유 한 문장으로 표현해주세요.
예: "비 오는 날 같은 쪽 처마 밑에 서 있는 사람", "라디오 볼륨을 같은 크기로 맞춰놓는 사이", "산책하다가 같은 곳에서 멈추는 사람"
- 한국어로만 작성해주세요.
- 추상적 표현(동반자, 존재, 빛 등) 대신 물리적 이미지를 사용하세요.
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
    return '비 오는 날 같은 쪽 처마 밑에 서 있는 사람';
  }
}
