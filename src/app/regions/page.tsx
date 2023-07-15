import { getRegionsCount, loadRegions, serializeRegions } from "@/components/table/fetchFunctions/loadRegions";
import { api } from "../api/[...remult]/route";
import { Card } from "@tremor/react";
import { texts } from "@/utils/shared/texts";
import HeaderBox from "@/components/common/HeaderBox";
import RegionsTable from "@/components/table/tableWrappers/RegionsTable";

export default async function Regions() {
  const { serializedFounders, count } = await api.withRemult(async () => {
    return {
      serializedFounders: serializeRegions(await loadRegions(1, 10)),
      count: await getRegionsCount()
    }
  });

  return (
    <Card>
      <HeaderBox title={texts.regions} />
      <RegionsTable
        initialData={serializedFounders}
        count={count}
      />
    </Card>
  )
}
