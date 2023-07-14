"use client";

import { texts } from "@/utils/shared/texts";
import {
  ArrowDownIcon,
  MapPinIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@tremor/react";
import LinkBtn from "../buttons/LinkBtn";

export default function OverviewBoxButtons({
  founderId,
  ordinanceId,
}: {
  founderId: string;
  ordinanceId: number;
}) {
  return (
    <>
      <LinkBtn
        href={`/founders/${founderId}/edit-ordinance/${ordinanceId}`}
        buttonProps={{
          icon: PencilSquareIcon,
          color: "slate",
          className: "my-2 w-full",
        }}
      >
        {texts.editOrdinanceText}
      </LinkBtn>
      <Button className="my-2 w-full" icon={MapPinIcon} color="emerald">
        {texts.viewOnMap}
      </Button>
      <Button
        className="my-2 w-full"
        variant="secondary"
        icon={ArrowDownIcon}
        color="slate"
      >
        {texts.downloadJson}
      </Button>
    </>
  );
}
