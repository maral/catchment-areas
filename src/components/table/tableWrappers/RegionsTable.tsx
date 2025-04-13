"use client";

import { texts } from "@/utils/shared/texts";
import CatchmentTable from "../CatchmentTable";
import CatchmentLink from "@/components/common/CatchmentLink";
import { ColumnDefinition } from "@/types/tableTypes";
import { Region } from "@/entities/Region";
import { deserializeRegions, loadRegions } from "../fetchFunctions/loadRegions";
import { routes } from "@/utils/shared/constants";

export default function RegionsTable({ initialData }: { initialData: any[] }) {
  const columnDefinitions: ColumnDefinition<Region>[] = [
    {
      title: texts.name,
      cellFactory: (item) => (
        <CatchmentLink href={`${routes.regions}/${item.code}`}>
          {item.name}
        </CatchmentLink>
      ),
    },
    {
      title: texts.shortName,
      cellFactory: (item) => item.shortName,
    },
  ];

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={loadRegions}
      initialData={deserializeRegions(initialData)}
    />
  );
}
