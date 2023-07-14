"use client";

import CatchmentTable from "@/components/table/CatchmentTable";
import { Founder } from "@/entities/Founder";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { useNavigationContext } from "@/providers/Providers";
import { Colors } from "@/styles/Themes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { getOrdinanceDocumentDownloadLink } from "@/utils/shared/ordinanceMetadata";
import { texts } from "@/utils/shared/texts";
import { Button } from "@tremor/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { remult } from "remult";

const ordinanceMetadataRepo = remult.repo(OrdinanceMetadata);
const foundersRepo = remult.repo(Founder);

export default function OrdinanceMetadataTable({
  founderId,
  addOrdinance,
}: {
  founderId: string;
  addOrdinance: (id: string) => void;
}) {
  const [addingOrdinance, setAddingOrdinance] = useState(false);
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
          <Link
            prefetch={false}
            href={getOrdinanceDocumentDownloadLink(item.id)}
            target="_blank"
          >
            {item.name}
          </Link>
        </span>
      ),
    },
    {
      title: texts.ordinanceNumber,
      cellFactory: (item) => item.number,
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
    {
      title: "",
      cellFactory: (item) => (
        <Button
          color={Colors.Primary}
          loading={addingOrdinance}
          onClick={() => {
            setAddingOrdinance(true);
            addOrdinance(item.id);
          }}
        >
          {texts.add}
        </Button>
      ),
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
