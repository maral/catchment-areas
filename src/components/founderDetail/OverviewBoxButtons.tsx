'use client';

import { ArrowDownIcon, PencilSquareIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { Button } from "@tremor/react"
import { texts } from "@/utils/texts";

export default function OverviewBoxButtons() {
  return (
    <>
      <Button className="my-2 w-full" icon={PencilSquareIcon} color="slate">{texts.editOrdinanceText}</Button>
      <Button className="my-2 w-full" icon={MapPinIcon} color="emerald">{texts.viewOnMap}</Button>
      <Button className="my-2 w-full" variant="secondary" icon={ArrowDownIcon} color="slate">{texts.downloadJson}</Button>
    </>
  );
}
