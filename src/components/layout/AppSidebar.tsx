"use client";

import { routes } from "@/utils/shared/constants";
import { Role, isAllowedRoute } from "@/utils/shared/permissions";
import { texts } from "@/utils/shared/texts";
import {
  AcademicCapIcon,
  MapIcon,
  PuzzlePieceIcon,
  UserIcon,
  ChartPieIcon,
} from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";

const spanClass = "ml-2 text-lg";

export default function AppSidebar({ className }: { className?: string }) {
  return (
    <Sidebar className={`${className} bg-slate-100`}>
      <SidebarHeader className="p-4">
        <span className="shrink-0 p-2 text-3xl font-title font-medium text-slate-700">
          {texts.catchmentAreas}
        </span>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarMenu>
            <MenuItem
              href={routes.kindergarten}
              icon={PuzzlePieceIcon}
              text={texts.schoolsKindergarten}
              requiredRole={Role.Editor}
            />

            <MenuItem
              href={routes.elementary}
              icon={AcademicCapIcon}
              text={texts.schoolsElementary}
              requiredRole={Role.Editor}
            />

            <MenuItem
              href={routes.users}
              icon={UserIcon}
              text={texts.users}
              requiredRole={Role.Admin}
            />

            <MenuItem
              href={routes.analytics}
              icon={ChartPieIcon}
              text={texts.analyticsLayers}
              requiredRole={Role.Editor}
            />

            <hr className="my-4" />

            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10">
                <Link href={routes.home} target="_blank">
                  <MapIcon className="text-primary" />
                  <span className={spanClass}>{texts.mapForPublic}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Link href="https://www.npi.cz/" target="_blank" className="p-2">
          <Image
            src="/logo_npi_svg_full.svg"
            alt="Logo NPI"
            width={200}
            height={49}
            priority={true}
          />
        </Link>
      </SidebarFooter>
    </Sidebar>
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
  const Icon = icon;

  if (!isAllowedRoute(href, role)) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} className="h-10">
        <Link href={href}>
          <Icon />
          <span className={spanClass}>{text}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
