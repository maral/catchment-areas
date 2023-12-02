import HeaderBox from "@/components/common/HeaderBox";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";
import { api } from "@/app/api/[...remult]/api";
import { getOrpsCount, loadOrps, serializeOrps } from "@/components/table/fetchFunctions/loadOrps";
import OrpsTable from "@/components/table/tableWrappers/OrpsTable";

export default async function Orps() {
  const { serializedOrps, count } = await api.withRemult(async () => {
    return {
      serializedOrps: serializeOrps(await loadOrps(1, 50)),
      count: await getOrpsCount()
    }
  });

  return (
    <Card>
      <HeaderBox title={texts.orp} />
      <OrpsTable
        initialData={serializedOrps}
        count={count}
      />
    </Card>
  )
}
