import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "考研打卡 — 学习计划管理",
  description: "考研复习打卡平台，记录每天的学习计划与完成情况",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
