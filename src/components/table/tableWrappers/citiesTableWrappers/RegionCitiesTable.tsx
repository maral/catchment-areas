"use client";

import CityStatusChip from "@/components/CityStatusChip";
import CatchmentLink from "@/components/common/CatchmentLink";
import { SimpleOrdinanceMap } from "@/controllers/CityController";
import { City } from "@/entities/City";
import { SchoolType } from "@/types/basicTypes";
import { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import CatchmentTable from "../../CatchmentTable";
import { deserializeCities } from "../../fetchFunctions/loadCities";

export default function RegionCitiesTable({
  regionCode,
  initialData,
  simpleOrdinances,
  count,
}: {
  regionCode: number;
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
            href={`${routes.cities}/${item.code}${routes.detail}${routes.regions}/${regionCode}`}
          >
            {item.name}
          </CatchmentLink>
        );
      },
    },
    {
      title: texts.county,
      cellFactory: (item) => item.county?.name,
    },
    {
      title: texts.numberOfSchools(SchoolType.Elementary),
      cellFactory: (item) => item.schoolCount,
    },
    {
      title: texts.status,
      cellFactory: (item) => (
        <CityStatusChip cityStatus={item.statusElementary} />
      ),
    },
  ];

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      initialData={deserializeCities(initialData)}
    />
  );
}
