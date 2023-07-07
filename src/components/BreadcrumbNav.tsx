'use client';

import { Subtitle } from '@tremor/react';
import { useNavigationContext } from "@/providers/Providers";
import CatchmentLink from './common/CatchmentLink';

export default function BreadcrumbNav({
  className
}: {
  className?: string;
}) {
  const { navigationItems } = useNavigationContext();

  const itemsWithoutLast = navigationItems.slice(0, navigationItems.length - 1);

  return (
    <div className={`flex mx-2 ${className ?? ''}`}>
      {itemsWithoutLast.map((item, index) => (
        <div key={index} className='flex'>
          <CatchmentLink href={item.href} className='mr-2'>
            {item.name}
          </CatchmentLink>
          <Subtitle className="text-slate-300 font-bold mr-2">
            /
          </Subtitle>
        </div>
      ))}
      {
        navigationItems.length > 0 &&
        <Subtitle className="font-bold text-slate-500">
          {navigationItems[navigationItems.length - 1].name}
        </Subtitle>
      }
      
    </div>
  ); 
}
