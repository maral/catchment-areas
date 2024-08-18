"use client";

import CatchmentTable from "@/components/table/CatchmentTable";
import { OrdinanceController } from "@/controllers/OrdinanceController";
import { City } from "@/entities/City";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { Colors } from "@/styles/Themes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { formatStringOrDate } from "@/utils/shared/date";
import { getOrdinanceDocumentDownloadLink } from "@/utils/shared/ordinanceMetadata";
import { replacePlaceholders, texts } from "@/utils/shared/texts";
import { Button } from "@tremor/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { remult } from "remult";
import { loadOrdinanceMetadata } from "../fetchFunctions/loadOrdinanceMetadata";

const ordinanceMetadataRepo = remult.repo(OrdinanceMetadata);
const citiesRepo = remult.repo(City);

export default function OrdinanceMetadataTable({
  cityCode,
  cityName,
  count,
  initialData,
}: {
  cityCode: string;
  cityName: string;
  count: number;
  initialData: any[];
}) {
  const [addingOrdinanceId, setAddingOrdinanceId] = useState("");

  const router = useRouter();

  const addOrdinanceFromCollection = async (ordinanceMetadataId: string) => {
    const response = await fetch("/api/ordinances/add-from-collection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cityCode,
        ordinanceMetadataId,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        OrdinanceController.determineActiveOrdinanceByFounderId(
          Number(cityCode)
        );
        router.push(
          `${routes.cities}/${cityCode}${routes.editOrdinance}/${result.ordinanceId}`
        );
      }
    } else {
      console.error("Error adding ordinance from collection");
      setAddingOrdinanceId("");
    }
  };

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
    const city = await citiesRepo.findId(Number(cityCode));
    return await loadOrdinanceMetadata(city, 1, 50);
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      initialData={initialData}
      count={count}
      fetchItems={fetchItems}
      showPagination={false}
      noDataText={replacePlaceholders(texts.noDataOrdinanceFromRegister, {
        city: cityName,
      })}
    />
  );
}
