import AppMenu from "@/components/layout/AppMenu";
import Providers from "@/providers/Providers";

export const metadata = {
  title: "Spádové oblasti",
  description:
    "Aplikace pro automatizaci převodu spádových oblastí z vyhlášek do mapy.",
};

export default function RootLayout({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb: React.ReactNode;
}) {
  const breadcrumbNav = <>{breadcrumb}</>;

  return (
    <Providers>
      <AppMenu breadcrumbNav={breadcrumbNav}>
        <main className="h-[calc(100vh-3.5rem)] overflow-auto p-6 grow flex flex-col bg-slate-50">
          {children}
        </main>
      </AppMenu>
    </Providers>
  );
}
