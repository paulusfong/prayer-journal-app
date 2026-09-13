import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Prayer Journal",
    template: "%s · Prayer Journal",
  },
  description: "A small-circle prayer journal",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
