"use client";

import CatchmentTable from "@/components/table/CatchmentTable";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { remult } from "remult";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/texts";

const ordinanceMetadataRepo = remult.repo(OrdinanceMetadata);

export default function OrdinanceMetadataTable({
  founderId,
}: {
  founderId: string;
}) {
  const columnDefinitions: ColumnDefinition<OrdinanceMetadata>[] = [
    {
      title: texts.name,
      cellFactory: (item) => item.name
    },
    {
      title: texts.ordinanceNumber,
      cellFactory: (item) => item.number
    },
    {
      title: texts.city,
      cellFactory: (item) => item.city
    },
    {
      title: texts.region,
      cellFactory: (item) => item.region
    },
    {
      title: texts.validFrom,
      cellFactory: (item) => item.validFrom
    },
    {
      title: texts.validTo,
      cellFactory: (item) => item.validTo ?? ''
    },
    {
      title: texts.publishedAt,
      cellFactory: (item) => item.publishedAt
    },
    {
      title: texts.approvedAt,
      cellFactory: (item) => item.approvedAt
    },
    {
      title: texts.version,
      cellFactory: (item) => item.version
    },
    {
      title: texts.valid,
      cellFactory: (item) => item.isValid ? texts.yes : texts.no
    },
  ];

  const count = async () => ordinanceMetadataRepo.count();

  const fetchItems = async (page: number, limit: number) => {
    return ordinanceMetadataRepo.find({
      limit,
      page,
      orderBy: { validFrom: "asc" },
    });
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
