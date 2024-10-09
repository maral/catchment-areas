import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import UploadOrdinance from "@/components/founderDetail/UploadOrdinance";
import {
  getOrdinanceMetadataCount,
  loadOrdinanceMetadata,
  serializeOrdinanceMetadata,
} from "@/components/table/fetchFunctions/loadOrdinanceMetadata";
import OrdinanceMetadataTable from "@/components/table/tableWrappers/OrdinanceMetadataTable";
import { City } from "@/entities/City";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";
import { notFound } from "next/navigation";
import { remult } from "remult";

export default async function AddOrdinance({
  params: { code },
}: {
  params: { code: string };
}) {
  const { cityName, serializedOrdinanceMetadata, count } = await api.withRemult(
    async () => {
      const city = await remult.repo(City).findId(Number(code));
      if (!city) {
        notFound();
      }
      return {
        cityName: city.name,
        serializedOrdinanceMetadata: serializeOrdinanceMetadata(
          await loadOrdinanceMetadata(city, 1, 50)
        ),
        count: await getOrdinanceMetadataCount(city),
      };
    }
  );

  return (
    <>
      {/* TOP PART OF THE VIEW */}
      <Card className="mb-12">
        <HeaderBox title={texts.addOrdinanceFromCollection} />
        <OrdinanceMetadataTable
          cityCode={code}
          initialData={serializedOrdinanceMetadata}
          count={count}
          cityName={cityName}
        />
      </Card>
      {/* BOTTOM PART OF THE VIEW */}
      <Card>
        <UploadOrdinance cityCode={code} />
      </Card>
    </>
  );
}
