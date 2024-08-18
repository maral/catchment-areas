import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import OrdinanceHeader from "@/components/founderDetail/OrdinanceHeader";
import OverviewBox from "@/components/founderDetail/OverviewBox";
import {
  loadOrdinancesByCityCode,
  serializeOrdinances,
} from "@/components/table/fetchFunctions/loadOrdinances";
import EditHistoryTable from "@/components/table/tableWrappers/EditHistoryTable";
import OrdinancesTable from "@/components/table/tableWrappers/OrdinancesTable";
import { City } from "@/entities/City";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";
import { notFound, redirect } from "next/navigation";
import { remult } from "remult";
import { routes } from "@/utils/shared/constants";
import { Founder } from "../../../../../../entities/Founder";
import OrdinanceFoundersTable from "../../../../../../components/table/tableWrappers/OrdinanceFoundersTable";

export default async function CityDetailPage({
  params: { code, from },
}: {
  params: { code: string; from?: string[] };
}) {
  const cityCode = Number(code);
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
    const ordinances = await loadOrdinancesByCityCode(cityCode);
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
      `${routes.cities}/${code}/add-ordinance${
        from ? `/${from.join("/")}` : ""
      }`
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* TOP PART OF THE VIEW */}
      <div className="h-1/2 pb-5 flex">
        <Card className="grow m-1 mr-4 overflow-y-auto">
          <OrdinanceHeader cityCode={code} urlFrom={from} />
          {founders.length === 1 && (
            <OrdinancesTable
              founderId={founders[0].id}
              cityCode={cityCode}
              initialData={serializedOrdinances}
              urlFrom={from}
            />
          )}

          {founders.length > 1 && (
            <OrdinanceFoundersTable
              initialOrdinances={serializedOrdinances}
              initialFounders={serializedFounders}
              cityCode={cityCode}
              urlFrom={from}
            />
          )}
        </Card>
        {/* overview box */}
        <OverviewBox
          activeOrdinanceId={activeOrdinanceId}
          cityProp={cityJson}
          urlFrom={from}
          className="flex-1 m-1 ml-2"
        />
      </div>
      {/* BOTTOM PART OF THE VIEW */}
      <div className="h-1/2 p-1">
        <Card className="h-full">
          <HeaderBox title={texts.editHistory} />
          <EditHistoryTable />
        </Card>
      </div>
    </div>
  );
}
