"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import CatchmentTable from "@/components/table/CatchmentTable";
import { OrdinanceController } from "@/controllers/OrdinanceController";
import { Ordinance } from "@/entities/Ordinance";
import { getRootPathBySchoolType } from "@/entities/School";
import { SchoolType } from "@/types/basicTypes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { PlayIcon } from "@heroicons/react/24/outline";
import {
  ArrowDownTrayIcon,
  MapIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { IconButton } from "../../ui/icon-button";
import {
  deserializeOrdinances,
  loadOrdinancesByCityCode,
} from "../fetchFunctions/loadOrdinances";

export default function OrdinancesTable({
  cityCode,
  founderId,
  initialData,
  schoolType,
}: {
  cityCode: number;
  founderId: number;
  initialData: any[];
  count?: number;
  schoolType: SchoolType;
}) {
  const rootPath = getRootPathBySchoolType(schoolType);

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
      cellFactory: (item, fetchData) => (
        <span className="whitespace-nowrap flex gap-2">
          <Link
            className="inline-block"
            href={`${rootPath}/${cityCode}${routes.editOrdinance}/${founderId}/${item.id}`}
            prefetch={false}
          >
            <IconButton
              icon={PencilSquareIcon}
              tooltip={texts.edit}
              size="sm"
            />
          </Link>
          <Link
            className="inline-block"
            href={`/api/ordinances/download/by-id/${item.id}`}
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
            href={`${rootPath}/${cityCode}${routes.map}/${item.id}`}
            target="_blank"
          >
            <IconButton
              icon={MapIcon}
              variant="default"
              tooltip={texts.viewOnMap}
              size="sm"
            />
          </Link>
          {!item.isActive && (
            <IconButton
              icon={PlayIcon}
              tooltip={texts.setActive}
              size="sm"
              onClick={async () => {
                await OrdinanceController.setActive(item.id);
                await fetchData();
              }}
            />
          )}
          <ConfirmDialog
            title={texts.deleteOrdinanceTitle}
            message={texts.deleteOrdinanceMessage}
            onConfirm={async () => {
              await OrdinanceController.deleteOrdinance(item.id);
              await fetchData();
            }}
            confirmButtonVariant="destructive"
            confirmText={texts.delete}
          >
            <IconButton
              variant="destructive"
              icon={TrashIcon}
              tooltip={texts.delete}
              size="sm"
            />
          </ConfirmDialog>
        </span>
      ),
    },
  ];

  const fetchItems = async () => {
    return loadOrdinancesByCityCode(cityCode, schoolType);
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      initialData={deserializeOrdinances(initialData)}
    />
  );
}
