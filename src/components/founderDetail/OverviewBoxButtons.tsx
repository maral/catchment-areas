'use client';

import { ArrowDownIcon, PencilSquareIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { Button } from "@tremor/react"
import { texts } from "@/utils/texts";
import LinkBtn from "../buttons/LinkBtn";
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
      <LinkBtn
        className="mb-4 w-full"
        href={`/founders/${founderId}/${currentOrdinanceId}`}
        buttonProps={{
          icon: PencilSquareIcon,
          color: Colors.Secondary,
        }}
      >
        {texts.editOrdinanceText}
      </LinkBtn>
      <LinkBtn
        className="mb-4 w-full"
        href={`/founders/${founderId}/${currentOrdinanceId}/map`}
        buttonProps={{
          icon: MapPinIcon,
          color: Colors.Primary,
        }}
      >
        {texts.viewOnMap}
      </LinkBtn>
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
