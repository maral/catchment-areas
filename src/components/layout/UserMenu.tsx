"use client";

import React from "react";
import { Button, Title } from "@tremor/react";
import Aavatar from "@/components/Avatar";
import { signOut, useSession } from "next-auth/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { texts } from "@/utils/texts";
import IconButton from "../buttons/IconButton";

export default function UserMenu() {
  const session = useSession();

  if (session && session.status === "authenticated") {
    return (
      <div className="flex items-center h-full mx-2">
        <Aavatar className="" image={session.data?.user?.image ?? ""} size="md" />
        <Title className="p-1 mr-2">{session.data?.user?.name}</Title>
        <IconButton
            icon={ArrowRightOnRectangleIcon}
            tooltip={texts.logout}
            onClick={() => signOut()}
          />
      </div>
    );
  } else {
    return (
      <div className="flex">
        <Button className="ml-2">
          <a href="/auth/signin">Přihlásit se</a>
        </Button>
      </div>
    );
  }
}
