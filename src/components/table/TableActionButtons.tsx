import { City } from "@/entities/City";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { MapIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { IconButton } from "../ui/icon-button";

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
        <IconButton icon={MapIcon} tooltip={texts.viewOnMap} size="sm" />
      </Link>
    </span>
  );
}
