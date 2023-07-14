'use client';

import { texts } from "@/utils/shared/texts";
import { Title } from "@tremor/react"
import { PlusIcon } from "@heroicons/react/24/solid";
import LinkButton from "@/components/buttons/LinkButton";

export default function OrdinanceHeader({
  founderId,
}: {
  founderId: string;
}) {
  return (
    <div className="flex justify-between mb-2">
      <Title className="px-2 py-3">{texts.ordinances}</Title>
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