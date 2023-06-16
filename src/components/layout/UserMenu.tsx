"use client";

import React from "react";
import { Button, Icon } from "@tremor/react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function UserMenu() {
  const session = useSession();

  if (session && session.status === "authenticated") {
    return (
      <div className="flex">
        <Image
          width="48"
          height="48"
          src={session.data?.user?.image ?? ""}
          alt="Fotka uživatele"
          className="rounded-full"
        />
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
