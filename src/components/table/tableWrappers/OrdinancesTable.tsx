"use client";

import IconButton from "@/components/buttons/IconButton";
import CatchmentTable from "@/components/table/CatchmentTable";
import { Ordinance } from "@/entities/Ordinance";
import { Colors } from "@/styles/Themes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/shared/texts";
import {
  ArrowDownTrayIcon,
  MapIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { remult } from "remult";
import { deserializeOrdinances } from "../fetchFunctions/loadOrdinances";
import { routes } from "@/utils/shared/constants";

const ordinancesRepo = remult.repo(Ordinance);

export default function OrdinancesTable({
  founderId,
  initialData,
  count,
  urlFrom,
}: {
  founderId: string;
  initialData: any[];
  count?: number;
  urlFrom?: string[];
}) {
  const columnDefinitions: ColumnDefinition<Ordinance>[] = [
    {
      title: texts.ordinanceNumber,
      cellFactory: (item) => item.number,
    },
    {
      title: texts.validFrom,
      cellFactory: (item) => item.validFrom.toLocaleDateString("cs"),
    },
    {
      title: texts.validTo,
      cellFactory: (item) => item.validTo?.toLocaleDateString("cs") ?? "",
    },
    {
      title: texts.active,
      cellFactory: (item) => (item.isActive ? texts.yes : texts.no),
    },
    {
      title: texts.actions,
      cellFactory: (item) => (
        <span className="whitespace-nowrap flex gap-2">
          <Link
            className="inline-block"
            href={
              urlFrom && urlFrom.length >= 2
                ? `${routes.founders}/${founderId}${routes.editOrdinance}/${urlFrom[0]}/${urlFrom[1]}/${item.id}`
                : `${routes.founders}/${founderId}${routes.editOrdinance}/${item.id}`
            }
            prefetch={false}
          >
            <IconButton
              color={Colors.Secondary}
              icon={PencilSquareIcon}
              tooltip={texts.edit}
              size="sm"
            />
          </Link>
          <Link
            className="inline-block"
            href={`/api/ordinances/${item.id}/download`}
            prefetch={false}
            target="_blank"
          >
            <IconButton
              icon={ArrowDownTrayIcon}
              tooltip={texts.downloadOrdinanceDocument}
              size="sm"
            />
          </Link>
          <Link
            className="inline-block"
            href={`${routes.founders}/${founderId}${routes.map}/${item.id}`}
            target="_blank"
          >
            <IconButton
              icon={MapIcon}
              color={Colors.Primary}
              tooltip={texts.viewOnMap}
              size="sm"
            />
          </Link>
        </span>
      ),
    },
  ];

  const fetchItems = async (page: number, limit: number) => {
    return ordinancesRepo.find({
      where: { founder: { $id: founderId } },
      limit,
      page,
      orderBy: { validFrom: "desc" },
    });
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      count={count}
      showPagination={false}
      initialData={deserializeOrdinances(initialData)}
    />
  );
}
