import HeaderBox from "@/components/common/HeaderBox";
import {
  getRegionsCount,
  loadRegions,
  serializeRegions
} from "@/components/table/fetchFunctions/loadRegions";
import RegionsTable from "@/components/table/tableWrappers/RegionsTable";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";
import { api } from "@/app/api/[...remult]/api";

export default async function Regions() {
  const { serializedRegions, count } = await api.withRemult(async () => {
    return {
      serializedRegions: serializeRegions(await loadRegions(1, 10)),
      count: await getRegionsCount()
    }
  });

  return (
    <Card>
      <HeaderBox title={texts.regions} />
      <RegionsTable
        initialData={serializedRegions}
        count={count}
      />
    </Card>
  )
}
