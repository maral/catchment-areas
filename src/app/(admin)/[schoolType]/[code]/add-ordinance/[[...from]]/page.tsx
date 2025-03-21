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
import { routes } from "@/utils/shared/constants";

export default async function AddOrdinance({
  params: { code, schoolType },
}: {
  params: { code: string; schoolType: string };
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
          await loadOrdinanceMetadata(city, 1, 50, schoolType)
        ),
        count: await getOrdinanceMetadataCount(city),
      };
    }
  );

  const rootPath = routes[schoolType as keyof typeof routes];

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
          schoolType={schoolType}
          rootPath={rootPath}
        />
      </Card>
      {/* BOTTOM PART OF THE VIEW */}
      <Card>
        <UploadOrdinance
          cityCode={code}
          schoolType={schoolType}
          rootPath={rootPath}
        />
      </Card>
    </>
  );
}
