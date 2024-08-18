"use client";

import CityStatusChip from "@/components/CityStatusChip";
import CatchmentLink from "@/components/common/CatchmentLink";
import { SimpleOrdinanceMap } from "@/controllers/CityController";
import { City } from "@/entities/City";
import { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import CatchmentTable from "../../CatchmentTable";
import {
  deserializeCities,
  loadCitiesByCounty,
} from "../../fetchFunctions/loadCities";
import TableActionButtons from "../../TableActionButtons";

export default function CountyCitiesTable({
  countyCode,
  simpleOrdinances,
  initialData,
  count,
}: {
  countyCode: number;
  initialData: any[];
  simpleOrdinances: SimpleOrdinanceMap;
  count?: number;
}) {
  const columnDefinitions: ColumnDefinition<City>[] = [
    {
      title: texts.name,
      cellFactory: (item) => {
        return (
          <CatchmentLink
            href={`${routes.cities}/${item.code}${routes.detail}${routes.counties}/${countyCode}`}
          >
            {item.name}
          </CatchmentLink>
        );
      },
    },
    {
      title: texts.region,
      cellFactory: (item) => item.region?.name,
    },
    {
      title: texts.orp,
      cellFactory: (item) => item.orp?.name,
    },
    {
      title: texts.numberOfSchools,
      cellFactory: (item) => item.schoolCount,
    },
    {
      title: texts.status,
      cellFactory: (item) => <CityStatusChip cityStatus={item.status} />,
    },
    {
      title: "",
      cellFactory: (item) => (
        <TableActionButtons
          item={item}
          activeOrdinanceId={simpleOrdinances[item.code]?.id}
        />
      ),
    },
  ];

  const fetchItems = async (page: number, limit: number) => {
    return await loadCitiesByCounty(countyCode, page, limit);
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      initialData={deserializeCities(initialData)}
      count={count}
    />
  );
}
