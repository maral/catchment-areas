"use client";

import CatchmentTable from "@/components/table/CatchmentTable";
import { Ordinance } from "@/entities/Ordinance";
import { remult } from "remult";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/texts";

const ordinancesRepo = remult.repo(Ordinance);

export default function OrdinancesTable() {
  const columnDefinitions: ColumnDefinition<Ordinance>[] = [
    {
      title: texts.url,
      cellFactory: (item) => item.documentUrl
    },
    {
      title: texts.validFrom,
      cellFactory: (item) => item.validFrom
    },
    {
      title: texts.validTo,
      cellFactory: (item) => item.validTo
    },
    {
      title: texts.active,
      cellFactory: (item) => item.isActive
    },
  ];

  const count = async () => ordinancesRepo.count();

  const fetchItems = async (page: number, limit: number) => {
    return ordinancesRepo.find({
      limit,
      page,
      orderBy: { validFrom: "asc" },
    });
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      count={count}
    />
  );
}
