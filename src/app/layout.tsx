import "./globals.css";
import { Inter } from "next/font/google";
import AppMenu from "@/components/layout/AppMenu";
import Providers from "@/providers/Providers";
import { getUserSettings } from "@/utils/server/loadUserSettings";
import constants from "@/utils/shared/constants";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Spádové oblasti",
  description: "Aplikace pro automatizaci převodu spádových oblastí z vyhlášek do mapy.",
};

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
  breadcrumb
}: {
  children: React.ReactNode;
  breadcrumb: React.ReactNode;
}) {
  const breadcrumbNav = (<>{breadcrumb}</>);
  const initialNavbarOpen = (await getUserSettings('isNavbarOpen') as boolean | null) ?? true;

  return (
    <html lang="en">
      <body className={`${inter.className} flex`}>
        <Providers>
          <AppMenu breadcrumbNav={breadcrumbNav} initialNavbarOpen={initialNavbarOpen}>
            <main className="p-6 grow flex flex-col bg-slate-50">
              {children}
            </main>
          </AppMenu>
        </Providers>
      </body>
    </html>
  );
}
