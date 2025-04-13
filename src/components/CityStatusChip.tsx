import { Colors } from "@/styles/Themes";
import { texts } from "@/utils/shared/texts";
import { CityStatus } from "@/entities/City";
import { Badge } from "@/components/ui/badge";

export default function CityStatusChip({
  cityStatus,
}: {
  cityStatus: CityStatus;
}) {
  const getStatus = (): {
    text: string;
    color: "default" | "secondary" | "destructive" | "outline" | "warning";
  } => {
    switch (cityStatus) {
      case CityStatus.Published:
        return {
          text: texts.statusPublished,
          color: "default",
        };
      case CityStatus.InProgress:
        return {
          text: texts.statusInProgress,
          color: "secondary",
        };
      case CityStatus.NoActiveOrdinance:
        return {
          text: texts.statusNoActiveOrdinance,
          color: "warning",
        };
      case CityStatus.NoOrdinance:
        return {
          text: texts.statusNoOrdinance,
          color: "destructive",
        };
      default: {
        return {
          text: texts.unknownStatus,
          color: "destructive",
        };
      }
    }
  };

  return <Badge variant={getStatus().color}>{getStatus().text}</Badge>;
}
