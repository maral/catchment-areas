'use client';

import CatchmentLink from "@/components/common/CatchmentLink";
import CatchmentTable from "@/components/table/CatchmentTable";
import TableActionButtons from "@/components/table/TableActionButtons";
import { deserializeFounders, loadFoundersByOrp } from "@/components/table/fetchFunctions/loadFounders";
import { Founder } from "@/entities/Founder";
import { ColumnDefinition } from "@/types/tableTypes";
import { modules, routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";

export default function OrpFoundersTable({
  orpCode,
  initialData,
  count,
}: {
  orpCode: string;
  initialData: any[];
  count?: number;
}) {
  const columnDefinitions: ColumnDefinition<Founder>[] = [
    {
      title: texts.name,
      cellFactory: (item) => {
        return (
          <CatchmentLink
            href={`${routes.founders}/${item.id}${routes.detail}${routes.orps}/${orpCode}`}
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
      cellFactory: (item) =>
        <TableActionButtons
          item={item}
          activeOrdinanceId={undefined}//item.activeOrdinance?.id}
          urlFrom={[modules.orps, orpCode]}
        />
    },
  ];

  const fetchItems = async (page: number, limit: number) => {
    return await loadFoundersByOrp(orpCode, page, limit);
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
