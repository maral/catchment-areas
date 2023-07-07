"use client";

import CatchmentTable from "@/components/table/CatchmentTable";
import { Founder } from "@/entities/Founder";
import { remult } from "remult";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/texts";
import { useEffect } from "react";
import { useNavigationContext } from "@/providers/Providers";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import Link from "next/link";

const ordinanceMetadataRepo = remult.repo(OrdinanceMetadata);
const foundersRepo = remult.repo(Founder);

export default function OrdinanceMetasTable({
  founderId,
}: {
  founderId: string;
}) {
  const { setNavigationItems } = useNavigationContext();

  useEffect(() => {
    let founder: Founder | null = null;
    const fetchFounder = async (id: string) => {
      founder = await foundersRepo.findId(Number(id));
      setNavigationItems([
        { href: "/founders", name: texts.founders },
        { href: `/founders/${founderId}`, name: founder?.name ?? "" },
      ]);
    };
    fetchFounder(founderId).catch(console.error);
  }, [founderId, setNavigationItems]);

  const columnDefinitions: ColumnDefinition<OrdinanceMetadata>[] = [
    {
      title: texts.ordinanceName,
      cellFactory: (item) => (
        <span className="whitespace-normal">
          <Link href={`https://sbirkapp.gov.cz/detail/${item.id}/text`}>
            {item.name}
          </Link>
        </span>
      ),
    },
    {
      title: texts.validFrom,
      cellFactory: (item) => item.validFrom.toLocaleDateString(),
    },
    {
      title: texts.validTo,
      cellFactory: (item) =>
        item.validTo ? item.validTo.toLocaleDateString() : "-",
    },
    {
      title: texts.active,
      cellFactory: (item) => (item.isValid ? texts.yes : texts.no),
    },
  ];

  const fetchItems = async () => {
    const founder = await foundersRepo.findId(Number(founderId));

    return ordinanceMetadataRepo.find({
      where: { $or: [{ city: founder.name }, { city: founder.shortName }] },
      orderBy: { validFrom: "asc" },
    });
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      showPagination={false}
    />
  );
}
