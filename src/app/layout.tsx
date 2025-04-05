import "@/app/globals.css";
import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Spádové oblasti – NPI ČR",
  description: "Spádové oblasti základních škol na mapě.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <GoogleTagManager gtmId="GTM-KWMX4GBK" />
      <Script
        defer
        data-domain="mapaspadovosti.zapojmevsechny.cz"
        src="https://npi-plausible.nomodo.app/js/script.js"
      />
      <body className="flex">{children}</body>
    </html>
  );
}
