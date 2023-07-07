import { texts } from "@/utils/texts";
import { Card, Title } from "@tremor/react"
import OrdinanceMetadataTable from "@/components/table/tableWrappers/OrdinanceMetadataTable";
import AddOrdinanceManually from "@/components/AddOrdinanceManually";

export default function AddOrdinance({
  params
} : {
  params: { id: string },
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* TOP PART OF THE VIEW */}
      <div className="h-1/2 pb-5 flex">
        <Card className="grow m-1">
        <Title className="px-2 py-3 mb-2">
          {texts.addOrdinanceFromCollection}
        </Title>
        <OrdinanceMetadataTable founderId={params.id} />
        </Card>
      </div>
      {/* BOTTOM PART OF THE VIEW */}
      <div className="h-1/2 p-1">
        <Card className="flex justify-center h-full">
          <div className="w-1/4">
            <AddOrdinanceManually />
          </div>
        </Card>
      </div>
    </div>
  );
}
