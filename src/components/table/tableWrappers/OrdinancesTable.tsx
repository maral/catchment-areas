"use client";

import CatchmentTable from "@/components/table";
import { Ordinance } from "@/entities/Ordinance";
import { Founder } from "@/entities/Founder";
import { remult } from "remult";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/texts";
import { useEffect } from "react";
import { useNavigationContext } from "@/providers/Providers";

const ordinancesRepo = remult.repo(Ordinance);
const foundersRepo = remult.repo(Founder);

export default function OrdinancesTable({
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
        { href: `/founders/${founderId}`, name: founder?.name ?? '' },
      ]);
    }
    fetchFounder(founderId).catch(console.error);
  }, [founderId, setNavigationItems]);


  const columnDefinitions: ColumnDefinition<Ordinance>[] = [
    {
      title: texts.url,
      cellFactory: (item) => item.documentUrl
    },
    {
      title: texts.validFrom,
      cellFactory: (item) => item.validFrom
    },
    {
      title: texts.validTo,
      cellFactory: (item) => item.validTo
    },
    {
      title: texts.active,
      cellFactory: (item) => item.isActive
    },
  ];

  const count = async () => ordinancesRepo.count();

  const fetchItems = async (page: number, limit: number) => {
    return ordinancesRepo.find({
      limit,
      page,
      orderBy: { validFrom: "asc" },
    });
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      count={count}
    />
  );
}