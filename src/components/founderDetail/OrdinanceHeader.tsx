'use client';

import { texts } from "@/utils/shared/texts";
import { PlusIcon } from "@heroicons/react/24/solid";
import LinkButton from "@/components/buttons/LinkButton";
import HeaderBox from "../common/HeaderBox";

export default function OrdinanceHeader({
  founderId,
}: {
  founderId: string;
}) {
  return (
    <div className="flex justify-between mb-2">
      <HeaderBox title={texts.ordinances} />
      <LinkButton
        className="m-2"
        href={`/founders/${founderId}/add-ordinance`}
        buttonProps={{ color: "emerald", icon: PlusIcon}}
      >
        {texts.addOrdinance}
      </LinkButton>
    </div>
  );
}