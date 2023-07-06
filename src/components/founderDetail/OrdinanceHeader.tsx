'use client';

import { texts } from "@/utils/texts";
import { Button, Title } from "@tremor/react"
import { PlusIcon } from "@heroicons/react/24/solid";
import { useRouter } from 'next/navigation'

export default function OrdinanceHeader({
  founderId,
}: {
  founderId: string;
}) {
  const router = useRouter();

  const onAddOrdinanceClick = () => {
    router.push(`/founders/${founderId}/add-ordinance`);
  };

  return (
    <div className="flex justify-between mb-2">
      <Title className="px-2 py-3">{texts.ordinances}</Title>
      <Button
        className="m-2"
        color="emerald"
        icon={PlusIcon}
        onClick={() => onAddOrdinanceClick()}
      >
        {texts.addOrdinance}
      </Button>
    </div>
  );
}