import { List, ListItem } from "@tremor/react";
import Link from "next/link";
import { texts } from '@/utils/shared/texts';

export default function Navbar({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={`${className ?? ""} bg-slate-100 border-r border-slate-300`}>
      <List className="p-4">
        <Link href="/founders">
          <ListItem className="cursor-pointer hover:bg-slate-50 rounded-md px-2">
            { texts.founders }
          </ListItem>
        </Link>

        <Link href="/users">
          <ListItem className="cursor-pointer hover:bg-slate-50 rounded-md px-2">
            { texts.users }
          </ListItem>
        </Link>
      </List>
    </div>
  );
}
