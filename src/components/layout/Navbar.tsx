import { Icon, List, ListItem, Title } from "@tremor/react";
import Link from "next/link";
import { texts } from '@/utils/shared/texts';
import { GlobeAltIcon, MapPinIcon, ShieldCheckIcon, UserIcon } from "@heroicons/react/24/solid";

export default function Navbar({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={`${className ?? ""} bg-slate-100 border-r border-slate-300`}>
      <div className="px-4 pt-4">
        <span className="p-2 text-2xl font-medium text-slate-600">{texts.catchmentAreas}</span>
      </div>
      <List className="p-4">
        <Link href="/founders">
          <ListItem className="cursor-pointer hover:bg-slate-50 rounded-md px-2 justify-start">
            <Icon icon={GlobeAltIcon} color="slate"></Icon>
            <span className="ml-2 text-lg">
              { texts.founders }
            </span>
          </ListItem>
        </Link>

        <Link href="/regions">
          <ListItem className="cursor-pointer hover:bg-slate-50 rounded-md px-2 justify-start">
            <Icon icon={ShieldCheckIcon} color="slate"></Icon>
            <span className="ml-2 text-lg">
              { texts.regions }
            </span>
          </ListItem>
        </Link>

        <Link href="/orps">
          <ListItem className="cursor-pointer hover:bg-slate-50 rounded-md px-2 justify-start">
            <Icon icon={MapPinIcon} color="slate"></Icon>
            <span className="ml-2 text-lg">
              { texts.orp }
            </span>
          </ListItem>
        </Link>

        <Link href="/users">
          <ListItem className="cursor-pointer hover:bg-slate-50 rounded-md px-2 justify-start">
            <Icon icon={UserIcon} color="slate"></Icon>
            <span className="ml-2 text-lg">
              { texts.users }
            </span>
          </ListItem>
        </Link>
      </List>
    </div>
  );
}
