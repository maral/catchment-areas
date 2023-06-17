"use client";

import CatchmentTable from "@/components/table";
import { remult } from "remult";
import { Founder } from "@/entities/Founder";
import { useState } from "react";
import type { ColumnDefinition, TableState } from "@/types/tableTypes";

const foundersRepo = remult.repo(Founder);

export default function FoundersTable() {
  const columnDefinitions: ColumnDefinition<Founder>[] = [
    {
      title: 'Název',
      getValue: (item) => item.name
    },
    {
      title: 'IČO',
      getValue: (item) => item.ico
    },
    {
      title: 'Kraj',
      getValue: (item) => item.city?.region?.name
    },
    {
      title: 'Okres',
      getValue: (item) => item.city?.county?.name
    },
    {
      title: 'ORP',
      getValue: (item) => item.city?.orp?.name
    },
    {
      title: 'Počet Škol',
      getValue: (item) => item.schoolCount
    }
  ];
    
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 25,
    total: 0,
  });
    
  const count = async () => foundersRepo.count();
    
  const fetchItems = async () => {
    return foundersRepo.find({
      limit: tableState.pageSize,
      page: tableState.page,
      orderBy: { name: "asc" },
      load: (f) => [f.city!],
    });
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      tableState={tableState}
      setTableState={setTableState}
      count={count}
    />
  );
}