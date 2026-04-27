import type { NextConfig } from "next";

/**
 * next/image 는 외부 호스트 이미지를 사용할 때 remotePatterns 에
 * 명시된 호스트만 허용합니다. Supabase Storage 의 public URL 을
 * 에세이 썸네일로 쓰기 위해 NEXT_PUBLIC_SUPABASE_URL 의 호스트를 등록해요.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
