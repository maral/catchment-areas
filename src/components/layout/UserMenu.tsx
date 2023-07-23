"use client";

import Avatar from "@/components/Avatar";
import IconButton from "@/components/buttons/IconButton";
import { texts } from "@/utils/shared/texts";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { Button, Title } from "@tremor/react";
import { signOut, useSession } from "next-auth/react";
import LinkButton from "../buttons/LinkButton";
import { Colors } from "@/styles/Themes";

export default function UserMenu() {
  const session = useSession();

  if (session && session.status === "authenticated") {
    return (
      <div className="flex items-center h-full mx-2">
        <Avatar
          className=""
          image={session.data?.user?.image ?? ""}
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
  } else {
    return (
      <div className="flex">
        <LinkButton
          href="/auth/signin"
          className="mx-4 my-2"
          buttonProps={{
            color: Colors.Primary,
            icon: ArrowRightOnRectangleIcon,
          }}
        >
          {texts.login}
        </LinkButton>
      </div>
    );
  }
}
