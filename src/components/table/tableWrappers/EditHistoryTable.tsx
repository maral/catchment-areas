"use client";

import CatchmentTable from "@/components/table/CatchmentTable";
import { remult } from "remult";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/texts";

type OrdinanceVersion = {
  edited: string;
  comment: string;
  author: string;
  status: string;
};

// const ordinanceVersionRepo = remult.repo(OrdinanceVersion);

export default function OrdinanceVersionsTable() {
  const columnDefinitions: ColumnDefinition<OrdinanceVersion>[] = [
    {
      title: texts.editedAt,
      cellFactory: (item) => item.edited
    },
    {
      title: texts.comment,
      cellFactory: (item) => item.comment
    },
    {
      title: texts.author,
      cellFactory: (item) => item.author
    },
    {
      title: texts.status,
      cellFactory: (item) => item.status
    },
  ];

  // const count = async () => ordinanceVersionRepo.count();
  const count = async () => 0;

  const fetchItems = async (page: number, limit: number) => {
    // return ordinanceVersionRepo.find({
    //   limit,
    //   page,
    //   orderBy: { edited: "asc" }
    // });
    return [];
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      count={count}
    />
  );
}
