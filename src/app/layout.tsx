import "../../public/styles.css";
import { Inter } from "next/font/google";
import AppMenu from "@/components/layout/AppMenu";
import Providers from "@/providers/Providers";

export const metadata = {
  title: "Spádové oblasti",
  description: "Aplikace pro automatizaci převodu spádových oblastí z vyhlášek do mapy.",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appbarItems = (<></>);  

  return (
    <html lang="en">
      <body className={`${inter.className} flex`}>
        <Providers>
          <AppMenu appbarItems={appbarItems}>
            <main className="bg-slate-50 p-10 grow flex flex-col">
              {children}
            </main>
          </AppMenu>
        </Providers>
      </body>
    </html>
  );
}
