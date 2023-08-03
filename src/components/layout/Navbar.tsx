import { Icon, List, ListItem } from "@tremor/react";
import Link from "next/link";
import { texts } from "@/utils/shared/texts";
import {
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  MapIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { routes } from "@/utils/shared/constants";
import { Colors } from "@/styles/Themes";
import Image from "next/image";

export default function Navbar({ className }: { className?: string }) {
  const listItemClass =
    "cursor-pointer hover:bg-slate-50 rounded-md px-2 justify-start";
  const spanClass = "ml-2 text-lg";

  return (
    <div
      className={`${
        className ?? ""
      } p-4 bg-slate-100 border-r border-slate-300 flex flex-col`}
    >
      <span className="flex-shrink-0 p-2 text-3xl font-title font-medium text-slate-700">
        {texts.catchmentAreas}
      </span>
      <div className="flex-grow flex flex-col justify-between">
        <List className="mt-6">
          <Link href={routes.founders}>
            <ListItem className={listItemClass}>
              <Icon icon={ShieldCheckIcon} color={Colors.Secondary}></Icon>
              <span className={spanClass}>{texts.founders}</span>
            </ListItem>
          </Link>

          <Link href={routes.regions}>
            <ListItem className={listItemClass}>
              <Icon icon={BuildingOffice2Icon} color={Colors.Secondary}></Icon>
              <span className={spanClass}>{texts.regions}</span>
            </ListItem>
          </Link>

          <Link href={routes.counties}>
            <ListItem className={listItemClass}>
              <Icon icon={BuildingOfficeIcon} color={Colors.Secondary}></Icon>
              <span className={spanClass}>{texts.counties}</span>
            </ListItem>
          </Link>

          <Link href={routes.orps}>
            <ListItem className={listItemClass}>
              <Icon icon={MapPinIcon} color={Colors.Secondary}></Icon>
              <span className={spanClass}>{texts.orp}</span>
            </ListItem>
          </Link>

          <Link href={routes.users}>
            <ListItem className={listItemClass}>
              <Icon icon={UserIcon} color={Colors.Secondary}></Icon>
              <span className={spanClass}>{texts.users}</span>
            </ListItem>
          </Link>

          <hr className="my-4" />

          <Link href={routes.map}>
            <ListItem className={listItemClass}>
              <Icon icon={MapIcon} color={Colors.Primary}></Icon>
              <span className={spanClass}>{texts.mapForPublic}</span>
            </ListItem>
          </Link>
        </List>

        <Link href="https://www.npi.cz/" target="_blank" className="p-2">
          <Image
            src="logo_npi_svg_full.svg"
            alt="Logo NPI"
            width={200}
            height={200}
          />
        </Link>
      </div>
    </div>
  );
}
