"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Appbar from "@/components/layout/Appbar";
import Navbar from "@/components/layout/Navbar";
import UserMenu from "@/components/layout/UserMenu";
import constants from "@/utils/shared/constants";
import { useUserSettings } from "@/utils/client/hooks";
import { UserSettings } from "@/entities/UserSettings";

export default function AppMenu({
  children,
  breadcrumbNav,
  initialNavbarOpen,
}: {
  children: React.ReactNode;
  breadcrumbNav: React.ReactNode;
  initialNavbarOpen: boolean;
}) {
  const [isNavbarOpen, setIsNavbarOpen] = useUserSettings(
    constants.userSettings.isNavbarOpen as keyof UserSettings,
    false
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
        <>
          <Navbar
            className={`${
              // isNavbarOpen ? "w-64" : "w-0"
              isNavbarOpen !== null ? (isNavbarOpen ? "w-64" : "w-0") : initialNavbarOpen ? "w-64" : "w-0"
            } ease-in-out duration-150 h-screen`}
          ></Navbar>
          <div className="grow flex flex-col">
            <Appbar toggleNavbar={toggleNavbar} breadcrumbNav={breadcrumbNav}>
              <UserMenu />
            </Appbar>
            {children}
          </div>
        </>
      )}
    </>
  );
}
