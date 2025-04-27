import { Badge } from "@/components/ui/badge";
import { CityStatus } from "@/entities/City";
import { texts } from "@/utils/shared/texts";

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
      case CityStatus.NoExistingOrdinance:
        return {
          text: texts.statusNoExistingOrdinance,
          color: "outline",
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
