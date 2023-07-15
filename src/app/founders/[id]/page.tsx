import { api } from "@/app/api/[...remult]/route";
import OrdinanceHeader from "@/components/founderDetail/OrdinanceHeader";
import OverviewBox from "@/components/founderDetail/OverviewBox";
import {
  loadOrdinances,
  serializeOrdinances,
} from "@/components/table/fetchFunctions/loadOrdinances";
import EditHistoryTable from "@/components/table/tableWrappers/EditHistoryTable";
import OrdinancesTable from "@/components/table/tableWrappers/OrdinancesTable";
import { Founder } from "@/entities/Founder";
import { texts } from "@/utils/shared/texts";
import { Card, Title } from "@tremor/react";
import { notFound } from "next/navigation";
import { remult } from "remult";

export default async function FounderPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const { serializedOrdinances, activeOrdinanceId, founder } =
    await api.withRemult(async () => {
      const founder = remult.repo(Founder).findId(Number(id));
      const ordinances = await loadOrdinances(id);
      return {
        serializedOrdinances: serializeOrdinances(ordinances),
        activeOrdinanceId: ordinances.find((o) => o.isActive)?.id,
        founder,
      };
    });

  if (!founder) {
    console.log("not found");
    notFound();
  }

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
