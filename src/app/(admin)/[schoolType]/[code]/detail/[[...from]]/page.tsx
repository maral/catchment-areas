import { api } from "@/app/api/[...remult]/api";
import OrdinanceHeader from "@/components/founderDetail/OrdinanceHeader";
import OverviewBox from "@/components/founderDetail/OverviewBox";
import {
  loadOrdinancesByCityCode,
  serializeOrdinances,
} from "@/components/table/fetchFunctions/loadOrdinances";
import OrdinanceFoundersTable from "@/components/table/tableWrappers/OrdinanceFoundersTable";
import OrdinancesTable from "@/components/table/tableWrappers/OrdinancesTable";
import { City } from "@/entities/City";
import { Founder } from "@/entities/Founder";
import { getRootPathBySchoolType, getSchoolTypeCode } from "@/entities/School";
import { Card } from "@tremor/react";
import { notFound, redirect } from "next/navigation";
import { remult } from "remult";

export default async function CityDetailPage({
  params: { code, from, schoolType },
}: {
  params: { code: string; from?: string[]; schoolType: string };
}) {
  const cityCode = Number(code);

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const {
    serializedOrdinances,
    serializedFounders,
    activeOrdinanceId,
    founders,
    cityJson,
  } = await api.withRemult(async () => {
    const city = await remult.repo(City).findFirst({ code: cityCode });

    if (!city) {
      notFound();
    }

    const founders = await remult.repo(Founder).find({ where: { city } });
    const cityJson = remult.repo(City).toJson(city);
    const ordinances = await loadOrdinancesByCityCode(cityCode, schoolTypeCode);
    return {
      serializedOrdinances: serializeOrdinances(ordinances),
      serializedFounders: remult.repo(Founder).toJson(founders),
      activeOrdinanceId: ordinances.find((o) => o.isActive)?.id,
      founders,
      cityJson,
    };
  });

  if (serializedOrdinances.length === 0) {
    redirect(
      `${getRootPathBySchoolType(schoolTypeCode)}/${code}/add-ordinance${
        from ? `/${from.join("/")}` : ""
      }`
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* TOP PART OF THE VIEW */}
      <div className="h-full pb-5 flex">
        <Card className="grow m-1 mr-4 overflow-y-auto">
          <OrdinanceHeader
            cityCode={code}
            urlFrom={from}
            schoolType={schoolTypeCode}
          />
          {founders.length === 1 && (
            <OrdinancesTable
              founderId={founders[0].id}
              cityCode={cityCode}
              initialData={serializedOrdinances}
              urlFrom={from}
              schoolType={schoolTypeCode}
            />
          )}

          {founders.length > 1 && (
            <OrdinanceFoundersTable
              initialOrdinances={serializedOrdinances}
              initialFounders={serializedFounders}
              cityCode={cityCode}
              urlFrom={from}
              schoolType={schoolTypeCode}
            />
          )}
        </Card>
        {/* overview box */}
        <OverviewBox
          activeOrdinanceId={activeOrdinanceId}
          cityProp={cityJson}
          urlFrom={from}
          schoolType={schoolTypeCode}
          className="flex-1 m-1 ml-2"
        />
      </div>
    </div>
  );
}
