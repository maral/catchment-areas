"use client";

import Avatar from "@/components/Avatar";
import { texts } from "@/utils/shared/texts";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { signOut, useSession } from "next-auth/react";
import { IconButton } from "../ui/icon-button";

export default function UserMenu() {
  const session = useSession();

  if (session && session.status === "authenticated") {
    return (
      <div className="flex items-center h-full mr-2 gap-2">
        <Avatar />
        <span className="p-1">{session.data?.user?.name}</span>
        <IconButton
          icon={ArrowRightOnRectangleIcon}
          size="default"
          tooltip={texts.logout}
          onClick={() => signOut()}
        />
      </div>
    );
  }
}
