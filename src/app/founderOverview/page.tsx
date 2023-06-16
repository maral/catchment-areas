"use client";

import CatchmentTable from "@/components/table";
import texts from "@/utils/texts";
import { remult } from "remult";
import { Founder } from "@/entities/Founder";
import { useState } from "react";
import type { ColumnDefinition, TableState } from "@/types/tableTypes";

const foundersRepo = remult.repo(Founder);

export default function FounderOverview() {
  const columnDefinitions: ColumnDefinition[] = [
    { title: 'Název', key: 'name' },
    { title: 'IČO', key: 'ico' },
    { title: 'Kraj', key: 'city.region.name' },
    { title: 'Okres', key: 'city.county.name' },
    { title: 'ORP', key: 'city.orp.name' },
    { title: 'Počet Škol', key: 'schoolCount' },
  ];

  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    perPage: 20,
    total: 0,
  });

  const count = async () => foundersRepo.count();

  const fetchItems = async () => {
    return foundersRepo.find({
      limit: tableState.perPage,
      page: tableState.page,
      orderBy: { name: "asc" },
      load: (f) => [f.city!],
    });
  };

  return (
    <>
      <div>
        <h1>{ texts.founders }</h1>
        <CatchmentTable
          columnDefinitions={columnDefinitions}
          fetchItems={fetchItems}
          tableState={tableState}
          setTableState={setTableState}
          count={count}
        />
      </div>
    </>
  );
}
