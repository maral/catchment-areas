import React from "react";
import { List, ListItem } from "@tremor/react";
import Link from "next/link";
import texts from '@/utils/texts';

export default function Navbar({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={`${className} border-r border-slate-300`}>
      <List className="p-4">
        <Link href="/test">
          <ListItem className="cursor-pointer hover:bg-slate-50 rounded-md">
            Test
          </ListItem>
        </Link>

        <Link href="/founderOverview">
          <ListItem className="cursor-pointer hover:bg-slate-50 rounded-md">
            { texts.founders }
          </ListItem>
        </Link>

        <Link href="/dynamic">
          <ListItem className="cursor-pointer hover:bg-slate-50 rounded-md">
            Všichni zřizovatelé
          </ListItem>
        </Link>
      </List>
    </div>
  );
}
