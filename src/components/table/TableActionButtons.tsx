import { City } from "@/entities/City";
import { texts } from "@/utils/shared/texts";
import { MapIcon } from "@heroicons/react/24/solid";
import { Colors } from "@/styles/Themes";
import IconButton from "../buttons/IconButton";
import Link from "next/link";
import { routes } from "@/utils/shared/constants";

export default function TableActionButtons({
  item,
  activeOrdinanceId,
}: {
  item: City;
  activeOrdinanceId?: number;
}) {
  return (
    <span className="whitespace-nowrap flex gap-2">
      <Link
        className="inline-block"
        href={`${routes.cities}/${item.code}${routes.map}/${activeOrdinanceId}`}
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
