import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Tools",
  description: "Blind voting on design explorations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
