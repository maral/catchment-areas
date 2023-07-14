'use client';

import { ArrowDownIcon, PencilSquareIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { Button } from "@tremor/react"
import { texts } from "@/utils/texts";
import LinkButton from "../buttons/LinkButton";
import { Colors } from "@/styles/Themes";

export default function OverviewBoxButtons({
  founderId,
  currentOrdinanceId,
}: {
  founderId: string;
  currentOrdinanceId: string;
}) {
  return (
    <>
      <LinkButton
        className="mb-4 w-full"
        href={`/founders/${founderId}/${currentOrdinanceId}`}
        buttonProps={{
          icon: PencilSquareIcon,
          color: Colors.Secondary,
        }}
      >
        {texts.editOrdinanceText}
      </LinkButton>
      <LinkButton
        className="mb-4 w-full"
        href={`/founders/${founderId}/${currentOrdinanceId}/map`}
        buttonProps={{
          icon: MapPinIcon,
          color: Colors.Primary,
        }}
      >
        {texts.viewOnMap}
      </LinkButton>
      <Button
        className="mb-4 w-full"
        variant="secondary"
        icon={ArrowDownIcon}
        color={Colors.Secondary}
      >
        {texts.downloadJson}
      </Button>
    </>
  );
}
