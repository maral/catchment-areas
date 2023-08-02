"use client";

import CatchmentLink from "@/components/common/CatchmentLink";
import { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/shared/texts";
import { Founder } from "@/entities/Founder";
import TableActionButtons from "../../TableActionButtons";
import CatchmentTable from "../../CatchmentTable";
import {
  deserializeFounders,
  loadFoundersByCounty,
} from "../../fetchFunctions/loadFounders";
import { modules, routes } from "@/utils/shared/constants";

export default function CountyFoundersTable({
  countyCode,
  initialData,
  count,
}: {
  countyCode: string;
  initialData: any[];
  count?: number;
}) {
  const columnDefinitions: ColumnDefinition<Founder>[] = [
    {
      title: texts.name,
      cellFactory: (item) => {
        return (
          <CatchmentLink
            href={`${routes.founders}/${item.id}${routes.detail}${routes.counties}/${countyCode}`}
          >
            {item.shortName}
          </CatchmentLink>
        );
      },
    },
    {
      title: texts.region,
      cellFactory: (item) => item.city?.region?.name,
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
      cellFactory: (item) =>
        <TableActionButtons
          item={item}
          activeOrdinanceId={undefined} //item.activeOrdinance?.id}
          urlFrom={[modules.counties, countyCode]}
        />,
    },
  ];

  const fetchItems = async (page: number, limit: number) => {
    return await loadFoundersByCounty(countyCode, page, limit);
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
