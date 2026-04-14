export interface SignalLevel {
  emoji: string;
  label: string;
  className: string;
  tone: "danger" | "warn" | "caution" | "safe";
}

export function getSignalLevel(score: number): SignalLevel {
  if (score >= 18) {
    return {
      emoji: "\u{1F6A8}",
      label: "위험",
      className: "bg-red-100 text-red-700",
      tone: "danger",
    };
  }
  if (score >= 13) {
    return {
      emoji: "\u{26A0}\u{FE0F}",
      label: "주의 필요",
      className: "bg-orange-100 text-orange-700",
      tone: "warn",
    };
  }
  if (score >= 8) {
    return {
      emoji: "\u{1F7E1}",
      label: "주의",
      className: "bg-yellow-100 text-yellow-700",
      tone: "caution",
    };
  }
  return {
    emoji: "\u{1F7E2}",
    label: "안전",
    className: "bg-green-100 text-green-700",
    tone: "safe",
  };
}
