'use client';

import { PencilSquareIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { Button } from "@tremor/react"

export default function OverviewBoxButtons() {
  return (
    <>
      <Button className="my-2 w-full" icon={PencilSquareIcon} color="sky">Upravit text vyhlášky</Button>
      <Button className="my-2 w-full" icon={MapPinIcon} color="emerald">Zobrazit na mapě</Button>
    </>
  );
}
