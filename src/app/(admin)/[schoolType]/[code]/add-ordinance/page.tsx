import { api } from "@/app/api/[...remult]/api";
import Header from "@/components/common/Header";
import HeaderBox from "@/components/common/HeaderBox";
import UploadOrdinance from "@/components/founderDetail/UploadOrdinance";
import {
  loadOrdinanceMetadata,
  serializeOrdinanceMetadata,
} from "@/components/table/fetchFunctions/loadOrdinanceMetadata";
import OrdinanceMetadataTable from "@/components/table/tableWrappers/OrdinanceMetadataTable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { City } from "@/entities/City";
import { getSchoolTypeCode } from "@/entities/School";
import { texts } from "@/utils/shared/texts";
import { notFound } from "next/navigation";
import { remult } from "remult";

export default async function AddOrdinance({
  params: { code, schoolType },
}: {
  params: { code: string; schoolType: string };
}) {
  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const { cityName, serializedOrdinanceMetadata } = await api.withRemult(
    async () => {
      const city = await remult.repo(City).findId(Number(code));
      if (!city) {
        notFound();
      }
      return {
        cityName: city.name,
        serializedOrdinanceMetadata: serializeOrdinanceMetadata(
          await loadOrdinanceMetadata(city, 1, 50, schoolTypeCode)
        ),
      };
    }
  );

  return (
    <>
      {/* TOP PART OF THE VIEW */}
      <Card className="mb-6">
        <CardHeader>
          <HeaderBox title={texts.addOrdinanceFromCollection} />
        </CardHeader>
        <CardContent>
          <OrdinanceMetadataTable
            cityCode={code}
            initialData={serializedOrdinanceMetadata}
            cityName={cityName}
            schoolType={schoolTypeCode}
          />
        </CardContent>
      </Card>
      {/* BOTTOM PART OF THE VIEW */}
      <Card>
        <CardHeader>
          <Header className="shrink">{texts.addOrdinanceManually}</Header>
        </CardHeader>
        <CardContent>
          <UploadOrdinance cityCode={code} schoolType={schoolTypeCode} />
        </CardContent>
      </Card>
    </>
  );
}
