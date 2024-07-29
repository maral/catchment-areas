import "@/app/globals.css";
import "@/app/otherGlobals.css";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Spádové oblasti – NPI ČR",
  description: "Spádové oblasti základních škol na mapě.",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex`}>{children}</body>
    </html>
  );
}
