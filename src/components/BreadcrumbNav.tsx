"use client";

import { BreadcrumbItem } from "@/utils/breadcrumbItems";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import CatchmentLink from "./common/CatchmentLink";

export default function BreadcrumbNav({
  items,
  className,
}: {
  items: Array<BreadcrumbItem>;
  className?: string;
}) {
  const itemsWithoutLast = items.slice(0, items.length - 1);

  return (
    <div className={`flex mr-2 ${className ?? ""}`}>
      {items.length > 1 ? (
        <Link href={items[items.length - 2].href}>
          <ChevronLeftIcon className="w-9 text-slate-500 cursor-pointer hover:text-slate-600 hover:bg-slate-300 rounded-full p-1" />
        </Link>
      ) : (
        <ChevronLeftIcon className="w-9 text-slate-300 rounded-full p-1" />
      )}
      <div className="flex items-center ml-2">
        {itemsWithoutLast.map((item, index) => (
          <div key={index} className="flex">
            <CatchmentLink href={item.href} className="mr-2">
              {item.title}
            </CatchmentLink>
            <span className="text-emerald-500 font-bold mr-2">/</span>
          </div>
        ))}
        {items.length > 0 && (
          <span className="font-bold text-slate-500">
            {items[items.length - 1].title}
          </span>
        )}
      </div>
    </div>
  );
}
