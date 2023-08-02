"use client";

import CatchmentTable from "@/components/table/CatchmentTable";
import { Founder, FounderStatus } from "@/entities/Founder";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { Ordinance } from "@/entities/Ordinance";
import { Colors } from "@/styles/Themes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { getOrdinanceDocumentDownloadLink } from "@/utils/shared/ordinanceMetadata";
import { texts } from "@/utils/shared/texts";
import { Button } from "@tremor/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { remult } from "remult";
import { formatStringOrDate } from "@/utils/shared/date";

const ordinanceMetadataRepo = remult.repo(OrdinanceMetadata);
const foundersRepo = remult.repo(Founder);

export default function OrdinanceMetadataTable({
  founderId,
  count,
  initialData,
}: {
  founderId: string;
  count: number;
  initialData: any[];
}) {
  const [addingOrdinanceId, setAddingOrdinanceId] = useState("");

  const router = useRouter();

  const addOrdinanceFromCollection = async (ordinanceMetadataId: string) => {
    const response = await fetch("/api/ordinance/add-from-collection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        founderId,
        ordinanceMetadataId,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        determineActiveOrdinanceByFounderId(Number(founderId));
        router.push(
          `${routes.founders}/${founderId}${routes.editOrdinance}/${result.ordinanceId}`
        );
        return;
      }
    }
    // @todo show error here
  };

  const determineActiveOrdinanceByFounderId = async (founderId: number) => {
    const ordinanceRepo = remult.repo(Ordinance);
    const founder = await remult.repo(Founder).findId(founderId);
    // find all ordinances for the founder
    const foundersOrdinances = await ordinanceRepo.find({
      where: { founder: { $id: founderId } },
      orderBy: { id: "desc" },
    });
    if (foundersOrdinances && foundersOrdinances.length) {
      // deactivate all active ordinances
      const activeOrdinances = foundersOrdinances.filter((ordinance) => ordinance.isActive);
      if (activeOrdinances.length) {
        activeOrdinances.forEach(async (ordinance) => {
          await ordinanceRepo.save({ ...ordinance, isActive: false});
        });
      }
      // find valid ordinances
      const validOrdinances = foundersOrdinances.filter((ordinance) =>
        ordinance.validFrom <= new Date() && ordinance.validTo ? ordinance.validTo >= new Date() : true
      );
      if (validOrdinances.length) {
        // activate the first valid ordinance
        await ordinanceRepo.save({ ...validOrdinances[0], isActive: true });
        // set founder status to InProgress
        if (founder && founder.status !== FounderStatus.InProgress) {
          await remult.repo(Founder).save({ ...founder, status: FounderStatus.InProgress });
        }
      } else {
        // set founder status to NoActiveOrdinance
        if (founder && founder.status !== FounderStatus.NoActiveOrdinance) {
          await remult.repo(Founder).save({ ...founder, status: FounderStatus.NoActiveOrdinance });
        }
      }
    }
  }

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
      cellFactory: (item) => formatStringOrDate(item.validFrom),
    },
    {
      title: texts.validTo,
      cellFactory: (item) => formatStringOrDate(item.validTo),
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
          loading={addingOrdinanceId === item.id}
          onClick={() => {
            setAddingOrdinanceId(item.id);
            addOrdinanceFromCollection(item.id);
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
      initialData={initialData}
      count={count}
      fetchItems={fetchItems}
      showPagination={false}
    />
  );
}
