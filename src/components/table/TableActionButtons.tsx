import { Founder } from "@/entities/Founder";
import { texts } from "@/utils/shared/texts";
import { MapIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import { Colors } from "@/styles/Themes";
import IconButton from "../buttons/IconButton";
import Link from "next/link";
import { routes } from "@/utils/shared/constants";

export default function TableActionButtons({
  item,
  activeOrdinanceId,
  urlFrom,
}: {
  item: Founder;
  activeOrdinanceId?: number;
  urlFrom?: string[];
}) {
  return (
    <span className="whitespace-nowrap flex gap-2">
      <Link
        className="inline-block"
        href={(urlFrom && urlFrom.length >= 2)
          ? `${routes.founders}/${item.id}${routes.editOrdinance}/${urlFrom[0]}/${urlFrom[1]}/${activeOrdinanceId}`
          : `${routes.founders}/${item.id}${routes.editOrdinance}/${activeOrdinanceId}`
        }
      >
        <IconButton
          icon={PencilSquareIcon}
          color={Colors.Secondary}
          tooltip={texts.editOrdinance}
          size="sm"
        />
      </Link>
      <Link
        className="inline-block"
        href={(urlFrom && urlFrom.length >= 2)
          ? `${routes.founders}/${item.id}${routes.map}/${urlFrom[0]}/${urlFrom[1]}/${activeOrdinanceId}`
          : `${routes.founders}/${item.id}${routes.map}/${activeOrdinanceId}`
        }
      >
        <IconButton
          icon={MapIcon}
          color={Colors.Primary}
          tooltip={texts.viewOnMap}
          size="sm"
        />
      </Link>
    </span>
  );
}