import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "学会事務局OS",
  description: "学会運営代行向けSaaS MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
