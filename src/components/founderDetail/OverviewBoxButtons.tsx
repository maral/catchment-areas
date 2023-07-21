"use client";

import { Colors } from "@/styles/Themes";
import { texts } from "@/utils/shared/texts";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import {
  MapPinIcon,
  PencilSquareIcon
} from "@heroicons/react/24/solid";
import LinkButton from "../buttons/LinkButton";
import { routes } from "@/utils/shared/constants";

export default function OverviewBoxButtons({
  founderId,
  activeOrdinanceId,
  urlFrom,
}: {
  founderId: string;
  activeOrdinanceId?: number;
  urlFrom?: string[];
}) {
  return (
    <>
      <LinkButton
        href={(urlFrom && urlFrom.length >= 2)
          ? `${routes.founders}/${founderId}${routes.editOrdinance}/${urlFrom[0]}/${urlFrom[1]}/${activeOrdinanceId}`
          : `${routes.founders}/${founderId}${routes.editOrdinance}/${activeOrdinanceId}`
        }
        buttonProps={{
          icon: PencilSquareIcon,
          color: Colors.Secondary,
          className: "my-2 w-full",
          disabled: !activeOrdinanceId,
        }}
      >
        {texts.editOrdinanceText}
      </LinkButton>
      <LinkButton
        href={(urlFrom && urlFrom.length >= 2)
          ? `${routes.founders}/${founderId}${routes.map}/${urlFrom[0]}/${urlFrom[1]}/${activeOrdinanceId}`
          : `${routes.founders}/${founderId}${routes.map}/${activeOrdinanceId}`}
        buttonProps={{
          icon: MapPinIcon,
          color: Colors.Primary,
          className: "my-2 w-full",
          disabled: !activeOrdinanceId,
        }}
      >
        {texts.viewOnMap}
      </LinkButton>
      <LinkButton
        href={`${routes.founders}/${founderId}${routes.download}/${activeOrdinanceId}`}
        buttonProps={{
          icon: ArrowDownTrayIcon,
          variant: "secondary",
          color: Colors.Secondary,
          className: "my-2 w-full",
          disabled: !activeOrdinanceId,
        }}
        target="_blank"
      >
        {texts.downloadJson}
      </LinkButton>
    </>
  );
}
