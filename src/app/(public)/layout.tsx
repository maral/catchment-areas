import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";

export default function PublicRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <GoogleTagManager gtmId="GTM-KWMX4GBK" />
      <Script
        defer
        data-domain="mapaspadovosti.zapojmevsechny.cz"
        src="https://npi-plausible.nomodo.app/js/script.js"
      />
    </>
  );
}
