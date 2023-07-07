'use client';

import { Subtitle } from '@tremor/react';
import CatchmentLink from './common/CatchmentLink';
import { BreadcrumbItem } from '@/utils/breadcrumbItems';


export default function BreadcrumbNav({
  items,
  className
}: {
  items: Array<BreadcrumbItem>;
  className?: string;
}) {
  const itemsWithoutLast = items.slice(0, items.length - 1);

  return (
    <div className={`flex mx-2 ${className ?? ''}`}>
      {itemsWithoutLast.map((item, index) => (
        <div key={index} className='flex'>
          <CatchmentLink href={item.href} className='mr-2'>
            {item.title}
          </CatchmentLink>
          <Subtitle className="text-slate-300 font-bold mr-2">
            /
          </Subtitle>
        </div>
      ))}
      {
        items.length > 0 &&
        <Subtitle className="font-bold text-slate-500">
          {items[items.length - 1].title}
        </Subtitle>
      }
      
    </div>
  ); 
}
