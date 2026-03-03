import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-manrope",
});

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
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
