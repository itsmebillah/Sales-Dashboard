import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Intelligence Platform",
  description: "Live executive sales intelligence powered by the Apps Script KPI engine.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#176b5b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
