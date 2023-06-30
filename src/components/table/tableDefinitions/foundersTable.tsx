'use client';

import CatchmentTable from "@/components/table";
import { remult } from "remult";
import { Founder } from "@/entities/Founder";
import Link from 'next/link'
import type { ColumnDefinition, TableState } from "@/types/tableTypes";
import { Button } from "@tremor/react";
import { Colors } from "@/styles/Themes";
import { texts } from "@/utils/texts";

const foundersRepo = remult.repo(Founder);

export default function FoundersTable() {
  const renderActionBtns = (item: Founder) => (
    <div className="flex">
      <Button
        className="mr-2"
        color={Colors.Primary}
        onClick={() => {
          console.log("map btn click", item.id);
        }}
      >
        {texts.map}
      </Button>
      <Button
        color={Colors.Secondary}
        onClick={() => {
          console.log("edit btn click", item.id);
        }}
      >
        {texts.editOrdinance}
      </Button>
    </div>
  );

  const columnDefinitions: ColumnDefinition<Founder>[] = [
    {
      title: texts.name,
      cellFactory: (item) => (
        <Link href={`/founders/${item.id}`}>
          <span className="text-emerald-500 hover:text-emerald-600 font-bold">
            {item.name}
          </span>
        </Link>
      ),
    },
    {
      title: texts.ico,
      cellFactory: (item) => item.ico
    },
    {
      title: texts.region,
      cellFactory: (item) => item.city?.region?.name
    },
    {
      title: texts.county,
      cellFactory: (item) => item.city?.county?.name
    },
    {
      title: texts.orp,
      cellFactory: (item) => item.city?.orp?.name
    },
    {
      title: texts.numberOfSchools,
      cellFactory: (item) => item.schoolCount
    },
    {
      title: "",
      cellFactory: (item) => renderActionBtns(item),
    },
  ];
    
  const count = async () => foundersRepo.count();
    
  const fetchItems = async (page: number, limit: number) => {
    return foundersRepo.find({
      limit,
      page,
      orderBy: { name: "asc" },
      load: (f) => [f.city!],
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
