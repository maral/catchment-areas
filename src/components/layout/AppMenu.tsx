"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Appbar from "@/components/layout/Appbar";
import Navbar from "@/components/layout/Navbar";
import UserMenu from "@/components/layout/UserMenu";
import constants from "@/utils/constants";
import { useLocalStorage } from "@/utils/hooks";

export default function AppMenu({
  children,
  appbarItems
}: {
  children: React.ReactNode;
  appbarItems: React.ReactNode;
}) {

  const [isNavbarOpen, setIsNavbarOpen] = useLocalStorage(constants.localStorageKey.isNavbarOpen, false);

  const pathname = usePathname();

  const toggleNavbar = () => {
    setIsNavbarOpen(!isNavbarOpen);
  };

  return (
    <>
      {/\/auth/g.test(pathname) ? (
        <div className="grow flex flex-col h-screen">
          {children}
        </div>
      ) : (
        <>
          <Navbar
            className={`${
              isNavbarOpen ? "w-64" : "w-0"
            } ease-in-out duration-150 h-screen`}
          ></Navbar>
          <div className="grow flex flex-col">
            <Appbar toggleNavbar={toggleNavbar}>
              { appbarItems }
              <UserMenu />
            </Appbar>
            {children}
          </div>
        </>
      )}
    </>
  );
}