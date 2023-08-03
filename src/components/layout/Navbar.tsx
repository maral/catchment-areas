import { Icon, List, ListItem } from "@tremor/react";
import Link from "next/link";
import { texts } from '@/utils/shared/texts';
import {
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  MapIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserIcon
} from "@heroicons/react/24/solid";
import { routes } from "@/utils/shared/constants";
import { Colors } from "@/styles/Themes";

export default function Navbar({
  className,
}: {
  className?: string;
}) {
  const listItemClass = 'cursor-pointer hover:bg-slate-50 rounded-md px-2 justify-start';
  const spanClass = 'ml-2 text-lg';

  return (
    <div className={`${className ?? ""} bg-slate-100 border-r border-slate-300`}>
      <div className="px-4 pt-4">
        <span className="p-2 text-2xl font-medium text-slate-600">{texts.catchmentAreas}</span>
      </div>
      <List className="p-4">
        <Link href={routes.founders}>
          <ListItem className={listItemClass}>
            <Icon icon={ShieldCheckIcon} color={Colors.Secondary}></Icon>
            <span className={spanClass}>
              { texts.founders }
            </span>
          </ListItem>
        </Link>

        <Link href={routes.regions}>
          <ListItem className={listItemClass}>
            <Icon icon={BuildingOffice2Icon} color={Colors.Secondary}></Icon>
            <span className={spanClass}>
              { texts.regions }
            </span>
          </ListItem>
        </Link>

        <Link href={routes.counties}>
          <ListItem className={listItemClass}>
            <Icon icon={BuildingOfficeIcon} color={Colors.Secondary}></Icon>
            <span className={spanClass}>
              { texts.counties }
            </span>
          </ListItem>
        </Link>

        <Link href={routes.orps}>
          <ListItem className={listItemClass}>
            <Icon icon={MapPinIcon} color={Colors.Secondary}></Icon>
            <span className={spanClass}>
              { texts.orp }
            </span>
          </ListItem>
        </Link>

        <Link href={routes.users}>
          <ListItem className={listItemClass}>
            <Icon icon={UserIcon} color={Colors.Secondary}></Icon>
            <span className={spanClass}>
              { texts.users }
            </span>
          </ListItem>
        </Link>

        <hr className="my-4" />

        <Link href={routes.map}>
          <ListItem className={listItemClass}>
            <Icon icon={MapIcon} color={Colors.Primary}></Icon>
            <span className={spanClass}>
              { texts.mapForPublic }
            </span>
          </ListItem>
        </Link>
      </List>
    </div>
  );
}
