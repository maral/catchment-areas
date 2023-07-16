"use client";

import { Colors } from "@/styles/Themes";
import { texts } from "@/utils/shared/texts";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import {
  MapPinIcon,
  PencilSquareIcon
} from "@heroicons/react/24/solid";
import LinkButton from "../buttons/LinkButton";

export default function OverviewBoxButtons({
  founderId,
  ordinanceId,
}: {
  founderId: string;
  ordinanceId: number;
}) {
  return (
    <>
      <LinkButton
        href={`/founders/${founderId}/edit-ordinance/${ordinanceId}`}
        buttonProps={{
          icon: PencilSquareIcon,
          color: Colors.Secondary,
          className: "my-2 w-full",
        }}
      >
        {texts.editOrdinanceText}
      </LinkButton>
      <LinkButton
        href={`/founders/${founderId}/map/${ordinanceId}`}
        buttonProps={{
          icon: MapPinIcon,
          color: Colors.Primary,
          className: "my-2 w-full",
        }}
      >
        {texts.viewOnMap}
      </LinkButton>
      <LinkButton
        href={`/founders/${founderId}/download/${ordinanceId}`}
        buttonProps={{
          icon: ArrowDownTrayIcon,
          variant: "secondary",
          color: Colors.Secondary,
          className: "my-2 w-full",
        }}
        target="_blank"
      >
        {texts.downloadJson}
      </LinkButton>
    </>
  );
}
