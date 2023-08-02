"use client";

import CatchmentLink from "@/components/common/CatchmentLink";
import CatchmentTable from "@/components/table/CatchmentTable";
import { Founder } from "@/entities/Founder";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/shared/texts";
import {
  deserializeFounders,
  loadFounders,
} from "@/components/table/fetchFunctions/loadFounders";
import TableActionButtons from "../../TableActionButtons";
import { routes } from "@/utils/shared/constants";

export default function FoundersTable({
  initialData,
  count,
}: {
  initialData: any[],
  count?: number
}) {
  const columnDefinitions: ColumnDefinition<Founder>[] = [
    {
      title: texts.name,
      cellFactory: (item) => (
        <CatchmentLink href={`${routes.founders}/${item.id}${routes.detail}`}>
          {item.shortName}
        </CatchmentLink>
      ),
    },
    {
      title: texts.region,
      cellFactory: (item) => item.city?.region?.name,
    },
    {
      title: texts.county,
      cellFactory: (item) => item.city?.county?.name,
    },
    {
      title: texts.numberOfSchools,
      cellFactory: (item) => item.schoolCount,
    },
    // {
    //   title: "",
    //   cellFactory: (item) =>
    //     <TableActionButtons
    //       item={item}
    //       activeOrdinanceId={item.activeOrdinance?.id}
    //     />
    // },
  ];

  const fetchItems = async (page: number, limit: number) => {
    return await loadFounders(page, limit);
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      initialData={deserializeFounders(initialData)}
      count={count}
    />
  );
}
