"use client";

import IconButton from "@/components/buttons/IconButton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import CatchmentTable from "@/components/table/CatchmentTable";
import { OrdinanceController } from "@/controllers/OrdinanceController";
import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { Colors } from "@/styles/Themes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import {
  ArrowDownTrayIcon,
  BoltIcon,
  MapIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useMemo, useState } from "react";
import { remult } from "remult";
import { deserializeOrdinances } from "../fetchFunctions/loadOrdinances";
import { DocumentTextIcon, PlayIcon } from "@heroicons/react/24/outline";

type Row = {
  founder: Founder | null;
  ordinance: Ordinance;
};

export default function OrdinanceFoundersTable({
  cityCode,
  initialFounders,
  initialOrdinances,
  count,
  urlFrom,
}: {
  cityCode: number;
  initialOrdinances: any[];
  initialFounders: any[];
  count?: number;
  urlFrom?: string[];
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmFunction, setConfirmFunction] = useState<
    (() => Promise<void>) | null
  >(null);

  const data = useMemo(() => {
    const ordinances = deserializeOrdinances(initialOrdinances);
    const founders = remult.repo(Founder).fromJson(initialFounders);
    return ordinances.flatMap((ordinance) =>
      [null, ...founders].map((founder) => ({ founder, ordinance }))
    );
  }, [initialOrdinances, initialFounders]);

  const columnDefinitions: ColumnDefinition<Row>[] = [
    {
      title: texts.ordinanceNumber,
      cellFactory: (item) =>
        item.founder === null ? (
          <strong>{item.ordinance.number}</strong>
        ) : (
          <span className="pl-2">{item.founder.name}</span>
        ),
    },
    {
      title: texts.validity,
      cellFactory: (item) =>
        item.founder === null
          ? `${item.ordinance.validFrom.toLocaleDateString("cs")}–${
              item.ordinance.validTo?.toLocaleDateString("cs") ?? "?"
            }`
          : `${item.founder.schoolCount} ${texts.schoolsDeclined(
              item.founder.schoolCount
            )}`,
    },
    {
      title: texts.active,
      cellFactory: (item) =>
        item.founder === null
          ? item.ordinance.isActive
            ? texts.yes
            : texts.no
          : "",
    },
    {
      title: texts.actions,
      cellFactory: (item, fetchData) => (
        <span className="whitespace-nowrap flex gap-2">
          {item.founder !== null && (
            <Link
              className="inline-block"
              href={
                urlFrom && urlFrom.length >= 2
                  ? `${routes.cities}/${cityCode}${routes.editOrdinance}/${item.founder.id}/${urlFrom[0]}/${urlFrom[1]}/${item.ordinance.id}`
                  : `${routes.cities}/${cityCode}${routes.editOrdinance}/${item.founder.id}/${item.ordinance.id}`
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
          )}

          {item.founder === null && (
            <>
              <Link
                className="inline-block"
                href={`/api/ordinances/download/by-id/${item.ordinance.id}`}
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
                href={`/api/download/smd-text/${item.ordinance.id}`}
                prefetch={false}
                target="_blank"
              >
                <IconButton
                  icon={DocumentTextIcon}
                  tooltip={texts.downloadSmd}
                  size="sm"
                />
              </Link>
            </>
          )}

          <Link
            className="inline-block"
            href={`${routes.cities}/${cityCode}${routes.map}/${
              item.founder !== null ? `founder/${item.founder.id}/` : ""
            }${item.ordinance.id}`}
            target="_blank"
          >
            <IconButton
              icon={MapIcon}
              color={Colors.Primary}
              tooltip={texts.viewOnMap}
              size="sm"
            />
          </Link>

          {item.founder === null && (
            <>
              {!item.ordinance.isActive && (
                <IconButton
                  icon={PlayIcon}
                  color={Colors.Secondary}
                  tooltip={texts.setActive}
                  size="sm"
                  onClick={async () => {
                    await OrdinanceController.setActive(item.ordinance.id);
                    window.location.reload();
                  }}
                />
              )}
              <IconButton
                icon={TrashIcon}
                color={Colors.Error}
                tooltip={texts.delete}
                size="sm"
                onClick={() => {
                  setConfirmFunction(() => async () => {
                    await OrdinanceController.deleteOrdinance(
                      item.ordinance.id
                    );
                    await fetchData();
                  });
                  setIsConfirmOpen(true);
                }}
              />
            </>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      <CatchmentTable
        columnDefinitions={columnDefinitions}
        count={count}
        showPagination={false}
        initialData={data}
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
