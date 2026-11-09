import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Curiosity Atlas — science, AI & the world, explained simply",
  description:
    "A local-first, ad-free reader for research papers, AI news, industry and geopolitics — summarized in plain English, verified across sources.",
};
export const viewport: Viewport = {
  themeColor: "#f7f8f2",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
