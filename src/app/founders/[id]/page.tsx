import OverviewBox from "@/components/founderDetail/OverviewBox";
import OrdinancesTable from "@/components/table/tableWrappers/OrdinancesTable";
import { Card, Title } from "@tremor/react";
import { texts } from "@/utils/shared/texts";
import EditHistoryTable from "@/components/table/tableWrappers/EditHistoryTable";
import OrdinanceHeader from "@/components/founderDetail/OrdinanceHeader";
import { api } from "@/app/api/[...remult]/route";
import { deserializeOrdinances, loadOrdinances, serializeOrdinances } from "@/components/table/fetchFunctions/loadOrdinances";

export default async function FounderPage({
  params: { id },
}: {
  params: { id: string };
}) { 
  const serializedOrdinances = await api.withRemult(async () => {
    return serializeOrdinances(await loadOrdinances(id));
  });
  const activeOrdinanceId = await api.withRemult(async () => {
    return deserializeOrdinances(serializedOrdinances).find((o) => o.isActive)?.id;
  })

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* TOP PART OF THE VIEW */}
      <div className="h-1/2 pb-5 flex">
        <Card className="grow m-1 mr-4">
          <OrdinanceHeader founderId={id} />
          <OrdinancesTable founderId={id} initialData={serializedOrdinances} />
        </Card>
        {/* overview box */}
        <OverviewBox
          ordinanceId={activeOrdinanceId}
          founderId={id}
          className="flex-1 m-1 ml-2"
        />
      </div>
      {/* BOTTOM PART OF THE VIEW */}
      <div className="h-1/2 p-1">
        <Card className="h-full">
          <Title className="px-2 py-3 mb-2">{texts.editHistory}</Title>
          <EditHistoryTable />
        </Card>
      </div>
    </div>
  );
}
