"use client";

import Appbar from "@/components/layout/Appbar";
import AppSidebar from "@/components/layout/AppSidebar";
import UserMenu from "@/components/layout/UserMenu";
import { useLocalStorage } from "@/utils/client/hooks";
import constants from "@/utils/shared/constants";
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
  const [isNavbarOpen, setIsNavbarOpen] = useLocalStorage(
    constants.localStorageKey.isNavbarOpen,
    true
  );

  const pathname = usePathname();

  const toggleNavbar = () => {
    setIsNavbarOpen(!isNavbarOpen);
  };

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
