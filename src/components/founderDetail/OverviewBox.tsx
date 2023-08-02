'use client';

import { Badge, BadgeProps, Card, Subtitle, Title } from "@tremor/react";
import OverviewBoxButtons from "@/components/founderDetail/OverviewBoxButtons";
import { texts } from "@/utils/shared/texts";
import { Founder, FounderStatus } from "@/entities/Founder";
import { Colors } from "@/styles/Themes";
import { useState } from "react";
import { remult } from "remult";

export default function OverviewBox({
  founderProp,
  activeOrdinanceId,
  urlFrom,
  className,
}: {
  founderProp: Founder;
  activeOrdinanceId?: number;
  urlFrom?: string[];
  className?: string;
}) {
  const [founder, setFounder] = useState<Founder>(founderProp);

  const fetchFounder = async () => {
    console.log('fetching founder', founder);
    const newFounder = await remult.repo(Founder).findId(founder.id)
    console.log('newFounder', newFounder);
    setFounder(newFounder);
  };

  const getStatus = (): {
    text: string;
    color: BadgeProps["color"];
  } => {
    switch (founder.status) {
      case FounderStatus.Completed:
        return {
          text: texts.statusPublished,
          color: Colors.Primary
        };
      case FounderStatus.InProgress:
        return {
          text: texts.statusInProgress,
          color: Colors.Secondary
        };
      case FounderStatus.NoActiveOrdinance:
        return {
          text: texts.statusNoActiveOrdinance,
          color: Colors.Warning
        };
      case FounderStatus.NoOrdinance:
        return {
          text: texts.statusNoOrdinance,
          color: Colors.Error
        };
      default: {
        return {
          text: texts.unknownStatus,
          color: Colors.Error
        }
      }
    }
  }
  return (
    <Card className={`${className ?? ""}`}>
      <div className="mb-4">
        <div className="flex justify-between w-60 my-1">
          <Subtitle className="text-tremor-content">{texts.status}:</Subtitle>
          <Badge color={getStatus().color}>
            {getStatus().text}
          </Badge>
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
