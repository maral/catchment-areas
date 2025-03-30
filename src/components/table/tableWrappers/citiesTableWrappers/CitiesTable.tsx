"use client";

import CityStatusChip from "@/components/CityStatusChip";
import CatchmentLink from "@/components/common/CatchmentLink";
import CatchmentTable from "@/components/table/CatchmentTable";
import {
  deserializeCities,
  loadCities,
} from "@/components/table/fetchFunctions/loadCities";
import {
  City,
  getCountPropertyBySchoolType,
  getStatusPropertyBySchoolType,
} from "@/entities/City";
import { getRootPathBySchoolType } from "@/entities/School";
import { SchoolType } from "@/types/basicTypes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { Badge } from "@tremor/react";
import { deserializeOrdinanceMetadata } from "../../fetchFunctions/loadOrdinanceMetadata";

export default function CitiesTable({
  initialData,
  newOrdinanceMetadata,
  schoolType,
}: {
  initialData: any[];
  newOrdinanceMetadata: any[];
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
      title: texts.numberOfSchools(schoolType),
      cellFactory: (item) => item[getCountPropertyBySchoolType(schoolType)],
    },
    {
      title: texts.status,
      cellFactory: (item) => (
        <>
          <CityStatusChip
            cityStatus={item[getStatusPropertyBySchoolType(schoolType)]}
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
  ];

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      initialData={deserializeCities(initialData)}
      showPagination={false}
    />
  );
}
