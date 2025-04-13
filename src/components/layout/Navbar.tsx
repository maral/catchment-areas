"use client";

import { Colors } from "@/styles/Themes";
import { routes } from "@/utils/shared/constants";
import { Role, isAllowedRoute } from "@/utils/shared/permissions";
import { texts } from "@/utils/shared/texts";
import {
  BuildingOffice2Icon,
  MapIcon,
  ShieldCheckIcon,
  UserIcon
} from "@heroicons/react/24/solid";
import { Icon, List, ListItem } from "@tremor/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const listItemClass =
  "cursor-pointer hover:bg-white rounded-md px-2 justify-start transition-colors";
const spanClass = "ml-2 text-lg";

export default function Navbar({ className }: { className?: string }) {
  return (
    <div
      className={`${className ?? ""} bg-slate-100 border-r border-slate-300`}
    >
      <div className="flex flex-col p-4 h-screen">
        <span className="shrink-0 p-2 text-3xl font-title font-medium text-slate-700">
          {texts.catchmentAreas}
        </span>
        <div className="grow flex flex-col justify-between">
          <List className="mt-6">
            <MenuItem
              href={routes.elementary}
              icon={ShieldCheckIcon}
              text={texts.schoolsElementary}
              requiredRole={Role.Editor}
            />
            <MenuItem
              href={routes.kindergarten}
              icon={ShieldCheckIcon}
              text={texts.schoolsKindergarten}
              requiredRole={Role.Editor}
            />

            <MenuItem
              href={routes.regions}
              icon={BuildingOffice2Icon}
              text={texts.regions}
            />

            <MenuItem
              href={routes.users}
              icon={UserIcon}
              text={texts.users}
              requiredRole={Role.Admin}
            />

            <hr className="my-4" />

            <Link href={routes.publicMap} target="_blank">
              <ListItem className={listItemClass}>
                <Icon icon={MapIcon} color={Colors.Primary}></Icon>
                <span className={spanClass}>{texts.mapForPublic}</span>
              </ListItem>
            </Link>
          </List>

          <Link href="https://www.npi.cz/" target="_blank" className="p-2">
            <Image
              src="/logo_npi_svg_full.svg"
              alt="Logo NPI"
              width={200}
              height={29}
              priority={true}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  text,
  href,
}: {
  icon: React.ElementType;
  text: string;
  href: string;
  requiredRole?: Role;
}) {
  const pathname = usePathname();
  const isActive = pathname.includes(href);
  const session = useSession();
  const role = session.data?.user.role as Role;

  if (!isAllowedRoute(href, role)) {
    return null;
  }

  return (
    <Link href={href}>
      <ListItem className={`${listItemClass} ${isActive ? "bg-slate-50" : ""}`}>
        <Icon icon={icon} color={Colors.Secondary}></Icon>
        <span className={spanClass}>{text}</span>
      </ListItem>
    </Link>
  );
}
