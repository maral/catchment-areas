import "@/app/globals.css";
import { Inter } from "next/font/google";
import AppMenu from "@/components/layout/AppMenu";
import Providers from "@/providers/Providers";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Spádové oblasti",
  description: "Aplikace pro automatizaci převodu spádových oblastí z vyhlášek do mapy.",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
  breadcrumb
}: {
  children: React.ReactNode;
  breadcrumb: React.ReactNode;
}) {
  const breadcrumbNav = (<>{breadcrumb}</>);

  return (
    <html lang="en">
      <body className={`${inter.className} flex`}>
        <Providers>
          <AppMenu breadcrumbNav={breadcrumbNav}>
            <main className="h-[calc(100vh-3.5rem)] overflow-auto p-6 grow flex flex-col bg-slate-50">
              {children}
            </main>
          </AppMenu>
        </Providers>
      </body>
    </html>
  );
}
