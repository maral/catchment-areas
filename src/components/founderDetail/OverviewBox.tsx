import { Badge, BadgeProps, Card, Subtitle, Title } from "@tremor/react";
import OverviewBoxButtons from "@/components/founderDetail/OverviewBoxButtons";
import { texts } from "@/utils/shared/texts";
import { Founder } from "@/entities/Founder";
import { Colors } from "@/styles/Themes";

export default function OverviewBox({
  founder,
  activeOrdinanceId,
  urlFrom,
  className,
}: {
  founder: Founder;
  activeOrdinanceId?: number;
  urlFrom?: string[];
  className?: string;
}) {
  const getStatus = (): {
    text: string;
    color: BadgeProps["color"];
  } => {
    if (!activeOrdinanceId) {
      return {
        text: texts.noOrdinance,
        color: Colors.Error
      }
    } else {
      return {
        text: texts.ordinanceUploaded,
        color: Colors.Primary
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
        activeOrdinanceId={activeOrdinanceId}
        founderId={String(founder.id)}
        urlFrom={urlFrom}
      />
    </Card>
  );
}
