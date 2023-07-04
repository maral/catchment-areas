import { Icon } from "@tremor/react";
import { Bars3Icon } from '@heroicons/react/24/solid';
import React from 'react';

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
      <div className="flex justify-between bg-slate-200 h-14 border-b border-slate-300">
        <Icon
          className="cursor-pointer"
          icon={Bars3Icon}
          color="slate"
          size="xl"
          onClick={toggleNavbar}
        />

        <div>
          {children}
        </div>
      </div>
    </div>
  );
};
