import OverviewBox from "@/components/OverviewBox";
import OrdinancesTable from "@/components/table/tableDefinitions/OrdinancesTable";
import { Card, Title } from "@tremor/react"

export default function Founder({
  params
} : {
  params: { id: string },
}) {
  
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* TOP PART OF THE VIEW */}
      <div className="h-1/2 pb-4 flex">
        <Card className="grow m-1 mr-4">
          <Title>Ordinances</Title>
          <OrdinancesTable />
        </Card>
        {/* overview box */}
        <OverviewBox className="flex-1 m-1 ml-2" />
      </div>
      {/* BOTTOM PART OF THE VIEW */}
      <div className="h-1/2 p-1">
        <Card className="h-full">
          {params.id}
        </Card>
      </div>
    </div>
  );
}
