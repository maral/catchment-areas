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
      {/* add env variable to disable this on localhost */}

      {process.env.NEXT_PUBLIC_IS_LOCALHOST !== "1" && (
        <>
          <GoogleTagManager gtmId="GTM-KWMX4GBK" />
          {/* <Script
            defer
            data-domain="mapaspadovosti.zapojmevsechny.cz"
            src="https://npi-plausible.nomodo.app/js/script.js"
          /> */}
        </>
      )}
    </>
  );
}
