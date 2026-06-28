/**
 * 저장된 /minds 마음지도 조회 (서버 전용 — admin 클라이언트 사용).
 *
 * 두 곳이 공유한다:
 *  - parts-map 라우트: 리드당 1회 캐시(이미 분석했으면 저장본 반환, LLM 미호출)
 *  - 결과 다시보기: GET /api/minds/parts-map?leadId= 와 페이지 /minds/r/[id]
 *
 * minds_leads.parts_map 컬럼엔 PartsMap 객체가 그대로 저장돼 있으므로,
 * readPartsMap 이 기대하는 { parts_map: ... } 컨테이너로 감싸 검증한다.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import {
  readPartsMap,
  type PartsMap,
} from "@/lib/self-workshop/core-belief-excavation";

export async function getSavedPartsMap(leadId: string): Promise<PartsMap | null> {
  if (!leadId) return null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("minds_leads")
      .select("parts_map")
      .eq("id", leadId)
      .maybeSingle();
    if (error || !data?.parts_map) return null;
    return readPartsMap({ parts_map: data.parts_map });
  } catch (err) {
    console.error("[minds] parts_map 조회 실패:", err);
    return null;
  }
}
