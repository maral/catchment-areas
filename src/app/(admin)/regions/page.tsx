import HeaderBox from "@/components/common/HeaderBox";
import {
  getRegionsCount,
  loadRegions,
  serializeRegions,
} from "@/components/table/fetchFunctions/loadRegions";
import RegionsTable from "@/components/table/tableWrappers/RegionsTable";
import { texts } from "@/utils/shared/texts";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Updated import
import { api } from "@/app/api/[...remult]/api";

export default async function Regions() {
  const { serializedRegions } = await api.withRemult(async () => {
    return {
      serializedRegions: serializeRegions(await loadRegions()),
      count: await getRegionsCount(),
    };
  });

  return (
    <Card>
      <CardHeader>
        <HeaderBox title={texts.regions} />
      </CardHeader>
      <CardContent>
        <RegionsTable initialData={serializedRegions} />
      </CardContent>
    </Card>
  );
}
