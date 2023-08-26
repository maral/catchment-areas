import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import UploadOrdinance from "@/components/founderDetail/UploadOrdinance";
import {
  getOrdinanceMetadataCount,
  loadOrdinanceMetadata,
  serializeOrdinancesMetadata,
} from "@/components/table/fetchFunctions/loadOrdinanceMetadata";
import OrdinanceMetadataTable from "@/components/table/tableWrappers/OrdinanceMetadataTable";
import { Founder } from "@/entities/Founder";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";
import { notFound } from "next/navigation";
import { remult } from "remult";

export default async function AddOrdinance({
  params: { id },
}: {
  params: { id: string };
}) {
  const { cityName, serializedOrdinanceMetadata, count } = await api.withRemult(
    async () => {
      const founder = await remult.repo(Founder).findId(Number(id));
      if (!founder) {
        notFound();
      }
      return {
        cityName: founder.shortName,
        serializedOrdinanceMetadata: serializeOrdinancesMetadata(
          await loadOrdinanceMetadata(founder, 1, 10)
        ),
        count: await getOrdinanceMetadataCount(founder),
      };
    }
  );

  return (
    <>
      {/* TOP PART OF THE VIEW */}
      <Card className="mb-12">
        <HeaderBox title={texts.addOrdinanceFromCollection} />
        <OrdinanceMetadataTable
          founderId={id}
          initialData={serializedOrdinanceMetadata}
          count={count}
          cityName={cityName}
        />
      </Card>
      {/* BOTTOM PART OF THE VIEW */}
      <Card>
        <UploadOrdinance founderId={id} />
      </Card>
    </>
  );
}
