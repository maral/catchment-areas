"use client";

import CatchmentTable from "@/components/table/CatchmentTable";
import { remult } from "remult";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/shared/texts";

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
      cellFactory: (item) => item.edited,
    },
    {
      title: texts.comment,
      cellFactory: (item) => item.comment,
    },
    {
      title: texts.author,
      cellFactory: (item) => item.author,
    },
    {
      title: texts.status,
      cellFactory: (item) => item.status,
    },
  ];

  return <CatchmentTable columnDefinitions={columnDefinitions} />;
}
