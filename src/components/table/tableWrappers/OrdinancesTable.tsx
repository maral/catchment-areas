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
  TrashIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { remult } from "remult";
import { deserializeOrdinances } from "../fetchFunctions/loadOrdinances";
import { routes } from "@/utils/shared/constants";
import { OrdinanceController } from "@/controllers/OrdinanceController";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useState } from "react";

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmFunction, setConfirmFunction] = useState<
    (() => Promise<void>) | null
  >(null);

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
          <IconButton
            icon={TrashIcon}
            color={Colors.Error}
            tooltip={texts.delete}
            size="sm"
            onClick={() => {
              setConfirmFunction(() => async () => {
                await OrdinanceController.deleteOrdinance(item.id);
                await fetchData();
              });
              setIsConfirmOpen(true);
            }}
          />
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
    <>
      <CatchmentTable
        columnDefinitions={columnDefinitions}
        fetchItems={fetchItems}
        count={count}
        showPagination={false}
        initialData={deserializeOrdinances(initialData)}
      />
      <ConfirmDialog
        title={texts.deleteOrdinanceTitle}
        message={texts.deleteOrdinanceMessage}
        onConfirm={async () => {
          if (confirmFunction) {
            await confirmFunction();
          }
        }}
        isOpen={isConfirmOpen}
        setIsOpen={setIsConfirmOpen}
        confirmColor={Colors.Error}
        confirmText={texts.delete}
      />
    </>
  );
}
