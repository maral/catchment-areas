import { api } from "@/app/api/[...remult]/api";
import OrdinanceHeader from "@/components/founderDetail/OrdinanceHeader";
import OverviewBox from "@/components/founderDetail/OverviewBox";
import {
  loadOrdinancesByCityCode,
  serializeOrdinances,
} from "@/components/table/fetchFunctions/loadOrdinances";
import OrdinanceFoundersTable from "@/components/table/tableWrappers/OrdinanceFoundersTable";
import OrdinancesTable from "@/components/table/tableWrappers/OrdinancesTable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { City } from "@/entities/City";
import { Founder } from "@/entities/Founder";
import { getSchoolTypeCode } from "@/entities/School";
import { notFound } from "next/navigation";
import { remult } from "remult";
import { sortFounders } from "@/utils/shared/founders";

export default async function CityDetailPage(props: {
  params: Promise<{ schoolType: string; code: string }>;
}) {
  const params = await props.params;

  const { schoolType, code } = params;

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

    const founders = await remult
      .repo(Founder)
      .find({ where: { city }, orderBy: { name: "asc" } });
    founders.sort((a, b) => sortFounders(a.name, b.name));
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

  // if (serializedOrdinances.length === 0) {
  //   redirect(
  //     `${getRootPathBySchoolType(schoolTypeCode)}/${code}/add-ordinance`
  //   );
  // }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* TOP PART OF THE VIEW */}
      <div className="h-full pb-5 flex">
        <Card className="grow m-1 mr-4 overflow-y-auto">
          <CardHeader>
            <OrdinanceHeader cityCode={code} schoolType={schoolTypeCode} />
          </CardHeader>
          <CardContent>
            {founders.length === 1 && (
              <OrdinancesTable
                founderId={founders[0].id}
                cityCode={cityCode}
                initialData={serializedOrdinances}
                schoolType={schoolTypeCode}
              />
            )}

            {founders.length > 1 && (
              <OrdinanceFoundersTable
                initialOrdinances={serializedOrdinances}
                initialFounders={serializedFounders}
                cityCode={cityCode}
                schoolType={schoolTypeCode}
              />
            )}
          </CardContent>
        </Card>
        {/* overview box */}
        <OverviewBox
          activeOrdinanceId={activeOrdinanceId}
          cityProp={cityJson}
          schoolType={schoolTypeCode}
          className="flex-1 m-1 ml-2"
        />
      </div>
    </div>
  );
}
