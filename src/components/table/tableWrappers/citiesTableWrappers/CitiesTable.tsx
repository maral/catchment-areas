"use client";

import CityStatusChip from "@/components/CityStatusChip";
import CatchmentLink from "@/components/common/CatchmentLink";
import CatchmentTable from "@/components/table/CatchmentTable";
import {
  deserializeCities,
  loadCities,
} from "@/components/table/fetchFunctions/loadCities";
import { City } from "@/entities/City";
import { SchoolType, getRootPathBySchoolType } from "@/entities/School";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { Badge } from "@tremor/react";
import { deserializeOrdinanceMetadata } from "../../fetchFunctions/loadOrdinanceMetadata";

export default function CitiesTable({
  initialData,
  newOrdinanceMetadata,
  count,
  schoolType,
}: {
  initialData: any[];
  newOrdinanceMetadata: any[];
  count?: number;
  schoolType: SchoolType;
}) {
  const newOrdinancesCityCodes = new Set(
    deserializeOrdinanceMetadata(newOrdinanceMetadata).map(
      (row) => row.cityCode
    )
  );
  const columnDefinitions: ColumnDefinition<City>[] = [
    {
      title: texts.name,
      cellFactory: (item) => (
        <CatchmentLink
          href={`${getRootPathBySchoolType(schoolType)}/${item.code}${
            routes.detail
          }`}
        >
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
    },
    {
      title: texts.numberOfSchools(schoolType),
      cellFactory: (item) =>
        schoolType === SchoolType.Kindergarten
          ? item.kindergartenCount
          : item.schoolCount,
    },
    {
      title: texts.status,
      cellFactory: (item) => (
        <>
          <CityStatusChip
            cityStatus={
              schoolType === SchoolType.Kindergarten
                ? item.statusKindergarten
                : item.statusElementary
            }
          />
          {newOrdinancesCityCodes.has(item.code) && (
            <>
              {" "}
              <Badge color={"yellow"}>{texts.newOrdinances}</Badge>
            </>
          )}
        </>
      ),
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
    return await loadCities(page, limit, schoolType);
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
