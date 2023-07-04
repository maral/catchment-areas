'use client';

import { texts } from "@/utils/texts";
import { Button, Title } from "@tremor/react"
import { PlusIcon } from "@heroicons/react/24/solid";

export default function OrdinanceHeader() {
  return (
    <div className="flex justify-between mb-2">
      <Title className="px-2 py-3">{texts.ordinances}</Title>
      <Button className="m-2" color="emerald" icon={PlusIcon}>{texts.addOrdinance}</Button>
    </div>
  );
}