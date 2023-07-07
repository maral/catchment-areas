import { Icon } from "@tremor/react";
import { Bars3Icon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import React from 'react';
import BreadcrumbNav from "../BreadcrumbNav";

export default function Appbar ({
  children,
  className,
  toggleNavbar
}: {
  toggleNavbar: () => void
  children?: React.ReactNode,
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex justify-between bg-slate-200 h-14 border-b border-slate-200">
        <div className="flex items-center">
          <Icon
            className="cursor-pointer hover:text-slate-600 hover:bg-slate-300 rounded-full p-1 ml-2"
            icon={Bars3Icon}
            color="slate"
            size="lg"
            onClick={toggleNavbar}
          />
          <Icon
            className="cursor-pointer hover:text-slate-600 hover:bg-slate-300 rounded-full p-1"
            icon={ChevronLeftIcon}
            color="slate"
            size="lg"
            onClick={toggleNavbar}
          />
          <BreadcrumbNav />
        </div>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
};
