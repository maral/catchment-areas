"use client";

import { texts } from "@/utils/shared/texts";
import CatchmentTable from "../CatchmentTable";
import CatchmentLink from "@/components/common/CatchmentLink";
import { ColumnDefinition } from "@/types/tableTypes";
import { Region } from "@/entities/Region";
import { deserializeRegions, loadRegions } from "../fetchFunctions/loadRegions";

export default function RegionsTable({
  initialData,
  count,
}: {
  initialData: any[];
  count?: number;
}) {
  const columnDefinitions: ColumnDefinition<Region>[] = [
    {
      title: texts.name,
      cellFactory: (item) => (
        <CatchmentLink href={`/regions/${item.code}`}>
          {item.name}
        </CatchmentLink>
      ),
    },
    {
      title: texts.shortName,
      cellFactory: (item) => item.shortName,
    }
  ];

  const fetchItems = async (page: number, limit: number) => {
    return loadRegions(page, limit);
  }

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      initialData={deserializeRegions(initialData)}
      count={count}
    />
  );
}