import { Colors } from "@/styles/Themes";
import { texts } from "@/utils/shared/texts";
import { Badge, BadgeProps } from "@tremor/react";
import { CityStatus } from "@/entities/City";

export default function CityStatusChip({
  cityStatus,
}: {
  cityStatus: CityStatus;
}) {
  const getStatus = (): {
    text: string;
    color: BadgeProps["color"];
  } => {
    switch (cityStatus) {
      case CityStatus.Published:
        return {
          text: texts.statusPublished,
          color: Colors.Primary,
        };
      case CityStatus.InProgress:
        return {
          text: texts.statusInProgress,
          color: Colors.Secondary,
        };
      case CityStatus.NoActiveOrdinance:
        return {
          text: texts.statusNoActiveOrdinance,
          color: Colors.Warning,
        };
      case CityStatus.NoOrdinance:
        return {
          text: texts.statusNoOrdinance,
          color: Colors.Error,
        };
      default: {
        return {
          text: texts.unknownStatus,
          color: Colors.Error,
        };
      }
    }
  };

  return <Badge color={getStatus().color}>{getStatus().text}</Badge>;
}
