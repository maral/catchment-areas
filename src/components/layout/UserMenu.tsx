"use client";

import React from "react";
import { Button, Icon } from "@tremor/react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { signOut, useSession } from "next-auth/react";

export default function UserMenu() {
  const session = useSession();

  if (session && session.status === "authenticated") {
    return (
      <div className="flex">
        <Icon icon={UserCircleIcon} color="slate" size="xl" />
        <span>{session.data?.user?.name}</span>
        <Button className="ml-2" onClick={() => signOut()}>
          Odhlásit se
        </Button>
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
