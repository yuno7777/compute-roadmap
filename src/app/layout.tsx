import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LearningProvider } from "@/store/learningStore";
import "katex/dist/katex.min.css";
import "@xyflow/react/dist/style.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem("compute_learning_state_v1");var theme="system";if(raw){var parsed=JSON.parse(raw);if(parsed&&(parsed.theme==="light"||parsed.theme==="dark"||parsed.theme==="system")){theme=parsed.theme;}}var sysDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var effective=theme==="system"?(sysDark?"dark":"light"):theme;var root=document.documentElement;root.dataset.theme=effective;root.classList.toggle("dark",effective==="dark");root.style.colorScheme=effective;}catch(e){}})();`;

export const metadata: Metadata = {
  title: "COMPUTE — From Electrons to Artificial Intelligence",
  description:
    "Interactive first-principles computing curriculum spanning physics, silicon, CPU architecture, operating systems, distributed systems, graphics, and artificial intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <LearningProvider>
          <AppShell>{children}</AppShell>
        </LearningProvider>
      </body>
    </html>
  );
}
