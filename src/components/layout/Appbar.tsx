import React from "react";
import { SidebarTrigger } from "../ui/sidebar";

export default function Appbar({
  children,
  breadcrumbNav,
  className,
}: {
  breadcrumbNav: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex justify-between bg-slate-200 h-14 border-b border-slate-200">
        <div className="flex items-center pl-3">
          <SidebarTrigger />
          {breadcrumbNav}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
