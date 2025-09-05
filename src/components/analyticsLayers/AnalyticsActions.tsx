"use client";

import LinkButton from "@/components/buttons/LinkButton";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { PlusIcon } from "@heroicons/react/24/solid";

export default function AnalyticsActions() {
  return (
    <LinkButton
      className="m-2"
      href={`${routes.analytics}${routes.new}`}
      buttonProps={{
        variant: "default",
      }}
    >
      <PlusIcon />
      {texts.importAnalytics}
    </LinkButton>
  );
}
