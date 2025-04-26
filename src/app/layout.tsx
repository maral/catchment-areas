import "@/app/globals.css";
import { Bitter, Noto_Sans } from "next/font/google";

export const dynamic = "force-dynamic";

const bitter = Bitter({
  subsets: ["latin"],
  variable: "--font-bitter",
  weight: "600",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  weight: "400",
});

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
    <html lang="cs" className={`${bitter.variable} ${notoSans.variable}`}>
      <body className="flex">{children}</body>
    </html>
  );
}
