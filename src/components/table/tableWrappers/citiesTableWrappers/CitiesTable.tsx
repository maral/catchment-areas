"use client";

import CityStatusChip from "@/components/CityStatusChip";
import CatchmentLink from "@/components/common/CatchmentLink";
import CatchmentTable from "@/components/table/CatchmentTable";
import {
  deserializeCities,
  loadCities,
} from "@/components/table/fetchFunctions/loadCities";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { City } from "@/entities/City";
import { deserializeOrdinanceMetadata } from "../../fetchFunctions/loadOrdinanceMetadata";
import LinkButton from "../../../buttons/LinkButton";
import { Badge } from "@tremor/react";

export default function CitiesTable({
  initialData,
  newOrdinanceMetadata,
  count,
}: {
  initialData: any[];
  newOrdinanceMetadata: any[];
  count?: number;
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
        <CatchmentLink href={`${routes.cities}/${item.code}${routes.detail}`}>
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
      title: texts.numberOfSchools,
      cellFactory: (item) => item.schoolCount,
    },
    {
      title: texts.status,
      cellFactory: (item) => (
        <>
          <CityStatusChip cityStatus={item.statusElementary} />
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
    return await loadCities(page, limit);
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
