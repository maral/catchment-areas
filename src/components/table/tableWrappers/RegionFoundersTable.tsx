'use client';

import CatchmentLink from "@/components/common/CatchmentLink";
import { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/shared/texts";
import { Founder } from "@/entities/Founder";
import TableActionButtons from "../TableActionButtons";
import CatchmentTable from "../CatchmentTable";
import { deserializeFounders, loadFoundersByRegion } from "../fetchFunctions/loadFounders";

export default function RegionFoundersTable({
  regionCode,
  initialData,
  count,
}: {
  regionCode: string
  initialData: any[],
  count?: number
}) {
  const columnDefinitions: ColumnDefinition<Founder>[] = [
    {
      title: texts.name,
      cellFactory: (item) => {
        return (
          <CatchmentLink href={`/regions/${regionCode}/${item.id}`}>
            {item.shortName}
          </CatchmentLink>
        )
      }
      
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
      title: texts.orp,
      cellFactory: (item) => item.city?.orp?.name,
    },
    {
      title: texts.numberOfSchools,
      cellFactory: (item) => item.schoolCount,
    },
    {
      title: "",
      cellFactory: (item) => <TableActionButtons item={item} />,
    },
  ];

  const fetchItems = async (page: number, limit: number) => {
    return await loadFoundersByRegion(regionCode, page, limit);
  }

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      initialData={deserializeFounders(initialData)}
      count={count}
    />
  );
}
