'use client';

import { PlusIcon } from "@heroicons/react/24/solid";
import { texts } from "@/utils/texts";
import LinkBtn from "@/components/buttons/LinkBtn";

export default function UsersActions() {
  return (
    <LinkBtn
      className="m-2"
      href={`/users/new`}
      buttonProps={{
        color: "emerald",
        icon: PlusIcon,
      }}
    >
      {texts.addUser}
    </LinkBtn>
  );
}