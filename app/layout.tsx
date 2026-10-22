import "./globals.css";
import SettingsApplier from "@/components/SettingsApplier";
import { PRE_PAINT_SCRIPT } from "@/lib/settingsShared";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The inline script changes these attributes before React hydrates.
    <html lang="en" data-theme="light" data-density="comfortable" data-text="md" data-contrast="normal" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body>
        <SettingsApplier />
        {children}
      </body>
    </html>
  );
}
