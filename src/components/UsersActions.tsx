'use client';

import { PlusIcon } from "@heroicons/react/24/solid";
import { texts } from "@/utils/shared/texts";
import LinkButton from "@/components/buttons/LinkButton";

export default function UsersActions() {
  return (
    <LinkButton
      className="m-2"
      href={`/users/new`}
      buttonProps={{
        color: "emerald",
        icon: PlusIcon,
      }}
    >
      {texts.addUser}
    </LinkButton>
  );
}