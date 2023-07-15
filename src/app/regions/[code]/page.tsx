import { api } from "@/app/api/[...remult]/route";
import HeaderBox from "@/components/common/HeaderBox";
import { loadFoundersByRegion, getFoundersCountByRegion, serializeFounders } from "@/components/table/fetchFunctions/loadFounders";
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
      serializedFounders: serializeFounders(await loadFoundersByRegion(region, 1, 10)),
      count: await getFoundersCountByRegion(region)
    };
  });

  return (
    <div>
      <HeaderBox title={region.name} />
    </div>
  );
}
