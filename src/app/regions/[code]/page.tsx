import { api } from "@/app/api/[...remult]/route";
import HeaderBox from "@/components/common/HeaderBox";
import {
  loadFoundersByRegion,
  getFoundersCountByRegion,
  serializeFounders
} from "@/components/table/fetchFunctions/loadFounders";
import RegionFoundersTable from "@/components/table/tableWrappers/RegionFoundersTable";
import { Region } from "@/entities/Region";
import { remult } from "remult";

export default async function RegionPage(
  {
    params: { code }
  }: {
    params: {
      code: string;
    };
  }
) {
  const { serializedFounders, count, region } = await api.withRemult(async () => {
    const region = await remult.repo(Region).findId(Number(code));
    return {
      region,
      serializedFounders: serializeFounders(await loadFoundersByRegion(code, 1, 10)),
      count: await getFoundersCountByRegion(code)
    };
  });

  return (
    <div>
      <HeaderBox title={region.name} />
      <RegionFoundersTable
        regionCode={code}
        initialData={serializedFounders}
        count={count}
      />
    </div>
  );
}
