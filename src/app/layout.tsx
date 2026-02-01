import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "GIBUN | 유튜브 알고리즘으로 미래의 남편상 찾기",
  description: "유튜브는 당신의 모든 것을 알고 있다! 유튜브 로그인만하면 나의 결혼 가치관부터 미래의 남편상까지 모두 알 수 있어요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
