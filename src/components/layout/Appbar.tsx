import { Icon } from "@tremor/react";
import { Bars3Icon } from '@heroicons/react/24/solid';
import React from 'react';

export default function Appbar ({
  children,
  breadcrumbNav,
  className,
  toggleNavbar
}: {
  toggleNavbar: () => void;
  breadcrumbNav: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
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
          {breadcrumbNav}
        </div>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
};
