import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import {
  loadFoundersByRegion,
  getFoundersCountByRegion,
  serializeFounders,
} from "@/components/table/fetchFunctions/loadFounders";
import RegionFoundersTable from "@/components/table/tableWrappers/foundersTableWrappers/RegionFoundersTable";
import { Region } from "@/entities/Region";
import { Card } from "@tremor/react";
import { remult } from "remult";

export default async function RegionDetailPage({
  params: { code },
}: {
  params: { code: string };
}) {
  const { serializedFounders, count, region } = await api.withRemult(
    async () => {
      const region = await remult.repo(Region).findId(Number(code));
      return {
        region,
        serializedFounders: serializeFounders(
          await loadFoundersByRegion(code, 1, 50)
        ),
        count: await getFoundersCountByRegion(code),
      };
    }
  );

  return (
    <Card>
      <HeaderBox title={region?.name} />
      <RegionFoundersTable
        regionCode={code}
        initialData={serializedFounders}
        count={count}
      />
    </Card>
  );
}
