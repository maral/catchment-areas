'use client';

import { PlusIcon } from "@heroicons/react/24/solid";
import { texts } from "@/utils/shared/texts";
import LinkButton from "@/components/buttons/LinkButton";
import { routes } from "@/utils/shared/constants";
import { Colors } from "@/styles/Themes";

export default function UsersActions() {
  return (
    <LinkButton
      className="m-2"
      href={`${routes.users}${routes.new}`}
      buttonProps={{
        color: Colors.Primary,
        icon: PlusIcon,
      }}
    >
      {texts.addUser}
    </LinkButton>
  );
}