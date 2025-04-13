"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import CatchmentTable from "@/components/table/CatchmentTable";
import { OrdinanceController } from "@/controllers/OrdinanceController";
import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { getRootPathBySchoolType } from "@/entities/School";
import { Colors } from "@/styles/Themes";
import { SchoolType } from "@/types/basicTypes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { DocumentTextIcon, PlayIcon } from "@heroicons/react/24/outline";
import {
  ArrowDownTrayIcon,
  MapIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useMemo } from "react";
import { remult } from "remult";
import { IconButton } from "../../ui/icon-button";
import { deserializeOrdinances } from "../fetchFunctions/loadOrdinances";

type Row = {
  founder: Founder | null;
  ordinance: Ordinance;
};

export default function OrdinanceFoundersTable({
  cityCode,
  initialFounders,
  initialOrdinances,
  urlFrom,
  schoolType,
}: {
  cityCode: number;
  initialOrdinances: any[];
  initialFounders: any[];
  urlFrom?: string[];
  schoolType: SchoolType;
}) {
  const data = useMemo(() => {
    const ordinances = deserializeOrdinances(initialOrdinances);
    const founders = remult.repo(Founder).fromJson(initialFounders);
    return ordinances.flatMap((ordinance) =>
      [null, ...founders].map((founder) => ({ founder, ordinance }))
    );
  }, [initialOrdinances, initialFounders]);

  const rootPath = getRootPathBySchoolType(schoolType);

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
          : `${
              schoolType == SchoolType.Elementary
                ? item.founder.schoolCount
                : item.founder.kindergartenCount
            } ${texts.schoolsDeclined(
              schoolType == SchoolType.Elementary
                ? item.founder.schoolCount
                : item.founder.kindergartenCount,
              schoolType
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
                  ? `${rootPath}/${cityCode}${routes.editOrdinance}/${item.founder.id}/${urlFrom[0]}/${urlFrom[1]}/${item.ordinance.id}`
                  : `${rootPath}/${cityCode}${routes.editOrdinance}/${item.founder.id}/${item.ordinance.id}`
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
            href={`${rootPath}/${cityCode}${routes.map}/${
              item.founder !== null ? `founder/${item.founder.id}/` : ""
            }${item.ordinance.id}`}
            target="_blank"
          >
            <IconButton
              icon={MapIcon}
              variant="default"
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
                    await fetchData();
                  }}
                />
              )}
              <ConfirmDialog
                title={texts.deleteOrdinanceTitle}
                message={texts.deleteOrdinanceMessage}
                onConfirm={async () => {
                  await OrdinanceController.deleteOrdinance(item.ordinance.id);
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
            </>
          )}
        </span>
      ),
    },
  ];

  return (
    <CatchmentTable columnDefinitions={columnDefinitions} initialData={data} />
  );
}
