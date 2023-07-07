'use client';

import LinkButton from "@/components/buttons/LinkButton";
import CatchmentLink from "@/components/common/CatchmentLink";
import CatchmentTable from "@/components/table/CatchmentTable";
import { Founder } from "@/entities/Founder";
import { Colors } from "@/styles/Themes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/shared/texts";
import { MapIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import { Button } from "@tremor/react";
import { remult } from "remult";

const foundersRepo = remult.repo(Founder);

export default function FoundersTable({ initialData }: { initialData: any[] }) {
  const renderActionButtons = (item: Founder) => (
    <div className="flex">
      <LinkButton
        className="mr-2"
        href={`/founders/${item.id}/map`}
        buttonProps={{
          icon: MapIcon,
          color: Colors.Primary
        }}
      >
        {texts.map}
      </LinkButton>
      <Button
        color={Colors.Secondary}
        icon={PencilSquareIcon}
        onClick={() => {
          console.log("redirect to this url:", `/founders/${item.id}/fetchCurrentOrdinanceId`);
        }}
      >
        {texts.editOrdinance}
      </Button>
    </div>
  );

  const columnDefinitions: ColumnDefinition<Founder>[] = [
    {
      title: texts.name,
      cellFactory: (item) => (
        <CatchmentLink href={`/founders/${item.id}`}>
          {item.shortName}
        </CatchmentLink>
      ),
    },
    {
      title: texts.ico,
      cellFactory: (item) => item.ico
    },
    {
      title: texts.region,
      cellFactory: (item) => item.city?.region?.name
    },
    {
      title: texts.county,
      cellFactory: (item) => item.city?.county?.name
    },
    {
      title: texts.orp,
      cellFactory: (item) => item.city?.orp?.name
    },
    {
      title: texts.numberOfSchools,
      cellFactory: (item) => item.schoolCount
    },
    {
      title: "",
      cellFactory: (item) => renderActionButtons(item),
    },
  ];
    
  const count = async () => foundersRepo.count();
    
  const fetchItems = async (page: number, limit: number) => {
    return foundersRepo.find({
      limit,
      page,
      orderBy: { shortName: "asc" },
      load: (f) => [f.city!],
    });
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      count={count}
      initialData={foundersRepo.fromJson(initialData)}
    />
  );
}
