"use client";

import Appbar from "@/components/layout/Appbar";
import AppSidebar from "@/components/layout/AppSidebar";
import UserMenu from "@/components/layout/UserMenu";
import { usePathname } from "next/navigation";
import React from "react";
import { SidebarProvider } from "../ui/sidebar";

export default function AppMenu({
  children,
  breadcrumbNav,
}: {
  children: React.ReactNode;
  breadcrumbNav: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      {/\/auth/g.test(pathname) ? (
        <div className="grow flex flex-col h-screen">{children}</div>
      ) : (
        <SidebarProvider>
          <AppSidebar />
          <div className="grow flex flex-col">
            <Appbar breadcrumbNav={breadcrumbNav}>
              <UserMenu />
            </Appbar>
            {children}
          </div>
        </SidebarProvider>
      )}
    </>
  );
}
