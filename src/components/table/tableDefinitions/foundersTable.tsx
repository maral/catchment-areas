"use client";

import CatchmentTable from "@/components/table";
import { remult } from "remult";
import { Founder } from "@/entities/Founder";
import { useState } from "react";
import Link from 'next/link'
import type { ColumnDefinition, TableState } from "@/types/tableTypes";
import { Button } from "@tremor/react";
import { Colors } from "@/styles/Themes";

const foundersRepo = remult.repo(Founder);


export default function FoundersTable() {
  const renderActionBtns = (item: Founder) => (
    <div className="flex">
      <Button
        className="mr-2"
        color={Colors.Primary}
        onClick={() => {
          console.log('map btn click', item.id)
        }}
      >
        mapa
      </Button>
      <Button
        color={Colors.Secondary}
        onClick={() => {
          console.log('edit btn click', item.id)
        }}
      >
        upravit vyhlášku
      </Button>
    </div>
  );

  const columnDefinitions: ColumnDefinition<Founder>[] = [
    {
      title: 'Název',
      cellFactory: (item) => (
        <Link href={`/founders/${item.id}`}>
          <span className="text-emerald-500 hover:text-emerald-600 font-bold">
            {item.name}
          </span>
        </Link>
      )
    },
    {
      title: 'IČO',
      cellFactory: (item) => item.ico
    },
    {
      title: 'Kraj',
      cellFactory: (item) => item.city?.region?.name
    },
    {
      title: 'Okres',
      cellFactory: (item) => item.city?.county?.name
    },
    {
      title: 'ORP',
      cellFactory: (item) => item.city?.orp?.name
    },
    {
      title: 'Počet Škol',
      cellFactory: (item) => item.schoolCount
    },
    {
      title: '',
      cellFactory: (item) => renderActionBtns(item)
    },
  ];
    
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 10
    ,
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