'use client';

import { Subtitle } from '@tremor/react';
import Link from 'next/link'
import { useNavigationContext } from "@/providers/Providers";

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
          <Link href={item.href} className="mr-2">
            <span className="text-emerald-500 hover:text-emerald-600 font-bold">
              {item.name}
            </span>
          </Link>
          <Subtitle className="text-emerald-500 font-bold mr-2">
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
