import { Colors } from "@/styles/Themes";
import { texts } from "@/utils/shared/texts";
import { Badge, BadgeProps } from "@tremor/react";
import { FounderStatus } from "@/entities/Founder";

export default function FounderStatusChip({
  founderStatus,
}: {
  founderStatus: FounderStatus;
}) {
  const getStatus = (): {
    text: string;
    color: BadgeProps["color"];
  } => {
    switch (founderStatus) {
      case FounderStatus.Published:
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
    <Badge color={getStatus().color}>
      {getStatus().text}
    </Badge>
  )
}
