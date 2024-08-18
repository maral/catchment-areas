"use client";

import CityStatusChip from "@/components/CityStatusChip";
import CatchmentLink from "@/components/common/CatchmentLink";
import CatchmentTable from "@/components/table/CatchmentTable";
import TableActionButtons from "@/components/table/TableActionButtons";
import {
  deserializeCities,
  loadCitiesByOrp,
} from "@/components/table/fetchFunctions/loadCities";
import { City } from "@/entities/City";
import { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { SimpleOrdinanceMap } from "../../../../controllers/CityController";

export default function OrpCitiesTable({
  orpCode,
  initialData,
  simpleOrdinances,
  count,
}: {
  orpCode: number;
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
            href={`${routes.cities}/${item.code}${routes.detail}${routes.orps}/${orpCode}`}
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
      title: texts.county,
      cellFactory: (item) => item.county?.name,
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
    return await loadCitiesByOrp(orpCode, page, limit);
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
