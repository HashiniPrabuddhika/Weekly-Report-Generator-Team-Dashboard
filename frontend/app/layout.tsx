import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — Weekly Reports & Team Dashboard`,
  description: `${APP_TAGLINE} Submit weekly reports, review team activity, and track progress.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
