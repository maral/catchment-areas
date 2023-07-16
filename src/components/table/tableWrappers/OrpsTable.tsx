'use client';

import { Orp } from "@/entities/Orp";
import CatchmentTable from "../CatchmentTable";
import { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/shared/texts";
import CatchmentLink from "@/components/common/CatchmentLink";
import { deserializeOrps, loadOrps } from "../fetchFunctions/loadOrps";

export default function OrpsTable({
  initialData,
  count,
}: {
  initialData: any[];
  count?: number;
}) {
  const columnDefinitions: ColumnDefinition<Orp>[] = [
    {
      title: texts.name,
      cellFactory: (item) => (
        <CatchmentLink href={`/orps/${item.code}`}>
          {item.name}
        </CatchmentLink>
      ),
    },
    {
      title: texts.region,
      cellFactory: (item) => item.region?.name,
    },
    {
      title: texts.county,
      cellFactory: (item) => item.county?.name,
    }
  ];

  const fetchItems = async (page: number, limit: number) => {
    return loadOrps(page, limit);
  }

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      initialData={deserializeOrps(initialData)}
      count={count}
    />
  );
}
