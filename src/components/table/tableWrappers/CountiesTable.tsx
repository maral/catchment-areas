'use client';

import CatchmentLink from "@/components/common/CatchmentLink";
import { County } from "@/entities/County";
import { ColumnDefinition } from "@/types/tableTypes";
import { loadCounties } from "../fetchFunctions/loadCounties";
import CatchmentTable from "../CatchmentTable";
import { texts } from "@/utils/shared/texts";
import { routes } from "@/utils/shared/constants";

export default function CountiesTable({
  initialData,
  count,
}: {
  initialData: any[];
  count?: number;
}) {
  const columnDefinitions: ColumnDefinition<County>[] = [
    {
      title: texts.name,
      cellFactory: (item) => (
        <CatchmentLink href={`${routes.counties}/${item.code}`}>
          {item.name}
        </CatchmentLink>
      )
    },
    {
      title: texts.region,
      cellFactory: (item) => item.region.name
    }
  ];

  const fetchItems = async (page: number, limit: number) => {
    return loadCounties(page, limit);
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      initialData={initialData}
      count={count}
    />
  )
}
