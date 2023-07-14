'use client';

import { Icon, Subtitle } from '@tremor/react';
import CatchmentLink from './common/CatchmentLink';
import { BreadcrumbItem } from '@/utils/breadcrumbItems';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';


export default function BreadcrumbNav({
  items,
  className
}: {
  items: Array<BreadcrumbItem>;
  className?: string;
}) {
  const itemsWithoutLast = items.slice(0, items.length - 1);

  return (
    <div className={`flex mr-2 ${className ?? ''}`}>
      {items.length > 1 ?
        <Link href={items[items.length - 2].href}>
          <Icon
            className="cursor-pointer hover:text-slate-600 hover:bg-slate-300 rounded-full p-1"
            icon={ChevronLeftIcon}
            color="slate"
            size="lg"
          />
        </Link>
        :
        <Icon
          className="text-slate-300 rounded-full p-1"
          icon={ChevronLeftIcon}
          color="slate"
          size="lg"
        />
      }
      <div className='flex items-center ml-2'>
        {itemsWithoutLast.map((item, index) => (
          <div key={index} className='flex'>
            <CatchmentLink href={item.href} className='mr-2'>
              {item.title}
            </CatchmentLink>
            <Subtitle className="text-emerald-500 font-bold mr-2">
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
      
    </div>
  ); 
}
