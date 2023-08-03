'use client';

import { Card, Subtitle, Title } from "@tremor/react";
import OverviewBoxButtons from "@/components/founderDetail/OverviewBoxButtons";
import { texts } from "@/utils/shared/texts";
import { Founder,  } from "@/entities/Founder";
import { useState } from "react";
import { remult } from "remult";
import FounderStatusChip from "../FounderStatusChip";

export default function OverviewBox({
  founderProp,
  activeOrdinanceId,
  urlFrom,
  className,
}: {
  founderProp: any;
  activeOrdinanceId?: number;
  urlFrom?: string[];
  className?: string;
}) {
  const [founder, setFounder] = useState<Founder>(
    remult.repo(Founder).fromJson(founderProp)
  );

  const fetchFounder = async () => {
    setFounder(await remult.repo(Founder).findId(founder.id, { useCache: false }));
  };

  return (
    <Card className={`${className ?? ""}`}>
      <div className="mb-4">
        <div className="flex justify-between w-60 my-1">
          <Subtitle className="text-tremor-content">{texts.status}:</Subtitle>
          <FounderStatusChip founderStatus={founder.status} />
        </div>
        <div className="flex justify-between w-60 my-1">
          <Subtitle className="text-tremor-content">{texts.numberOfSchools}:</Subtitle>
          <Title className="mr-2">{founder.schoolCount}</Title>
        </div>
      </div>
      <OverviewBoxButtons
        founder={founder}
        fetchFounder={fetchFounder}
        activeOrdinanceId={activeOrdinanceId}
        urlFrom={urlFrom}
      />
    </Card>
  );
}
