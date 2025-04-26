"use client";

import Avatar from "@/components/Avatar";
import { texts } from "@/utils/shared/texts";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { signOut, useSession } from "next-auth/react";
import { IconButton } from "../ui/icon-button";
import { Skeleton } from "../ui/skeleton";

export default function UserMenu() {
  const session = useSession();

  return (
    <div className="flex items-center h-full mr-2 gap-2">
      {session && session.status === "authenticated" ? (
        <>
          <Avatar />
          <span className="p-1">{session.data?.user?.name}</span>
          <IconButton
            icon={ArrowRightOnRectangleIcon}
            size="default"
            tooltip={texts.logout}
            onClick={() => signOut()}
          />
        </>
      ) : (
        <>
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-sm" />
          <Skeleton className="h-8 w-10 rounded-sm" />
        </>
      )}
    </div>
  );
}
