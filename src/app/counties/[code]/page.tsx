import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import { getFoundersCountByCounty, loadFoundersByCounty, serializeFounders } from "@/components/table/fetchFunctions/loadFounders";
import CountyFoundersTable from "@/components/table/tableWrappers/foundersTableWrappers/CountyFoundersTable";
import { County } from "@/entities/County";
import { remult } from "remult";

export default async function CountyDetailPage({
  params: { code },
}: {
  params: { code: string };
}) {
  const { serializedFounders, count, county } = await api.withRemult(
    async () => {
      const county = await remult.repo(County).findId(Number(code));
      return {
        county,
        serializedFounders: serializeFounders(
          await loadFoundersByCounty(code, 1, 10)
        ),
        count: await getFoundersCountByCounty(code),
      };
    }
  );

  return (
    <div>
      <HeaderBox title={county.name} />
      <CountyFoundersTable
        countyCode={code}
        initialData={serializedFounders}
        count={count}
      />
    </div>
  );
}