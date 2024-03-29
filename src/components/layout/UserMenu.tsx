"use client";

import Avatar from "@/components/Avatar";
import IconButton from "@/components/buttons/IconButton";
import { texts } from "@/utils/shared/texts";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { Title } from "@tremor/react";
import { signOut, useSession } from "next-auth/react";

export default function UserMenu() {
  const session = useSession();

  if (session && session.status === "authenticated") {
    return (
      <div className="flex items-center h-full mx-2">
        <Avatar
          className="mr-1"
          image={session.data?.user?.image}
          size="md"
        />
        <Title className="p-1 mr-2">{session.data?.user?.name}</Title>
        <IconButton
          icon={ArrowRightOnRectangleIcon}
          tooltip={texts.logout}
          onClick={() => signOut()}
        />
      </div>
    );
  }
}
