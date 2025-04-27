"use client";

import CityStatusChip from "@/components/CityStatusChip";
import CatchmentLink from "@/components/common/CatchmentLink";
import CatchmentTable from "@/components/table/CatchmentTable";
import { deserializeCities } from "@/components/table/fetchFunctions/loadCities";
import { Badge } from "@/components/ui/badge";
import {
  City,
  CityStatus,
  getCountPropertyBySchoolType,
  getStatusPropertyBySchoolType,
} from "@/entities/City";
import { getRootPathBySchoolType } from "@/entities/School";
import { SchoolType } from "@/types/basicTypes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { deserializeOrdinanceMetadata } from "../../fetchFunctions/loadOrdinanceMetadata";

export function CitiesTable({
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
        <Italicize item={item} schoolType={schoolType}>
          <CatchmentLink
            href={`${getRootPathBySchoolType(schoolType)}/${item.code}${
              routes.detail
            }`}
          >
            {item.name}
          </CatchmentLink>
        </Italicize>
      ),
    },
    {
      title: texts.region,
      cellFactory: (item) => (
        <Italicize item={item} schoolType={schoolType}>
          {item.region?.name}
        </Italicize>
      ),
    },
    {
      title: texts.numberOfSchools(schoolType),
      cellFactory: (item) => (
        <Italicize item={item} schoolType={schoolType}>
          {item[getCountPropertyBySchoolType(schoolType)]}
        </Italicize>
      ),
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
              <Badge variant="warning">{texts.newOrdinances}</Badge>
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
    />
  );
}

function Italicize({
  item,
  schoolType,
  children,
}: {
  item: City;
  schoolType: SchoolType;
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        item[getStatusPropertyBySchoolType(schoolType)] ===
        CityStatus.NoExistingOrdinance
          ? "italic opacity-50"
          : ""
      }
    >
      {children}
    </span>
  );
}
