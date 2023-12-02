import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import { getFoundersCount, loadFounders, serializeFounders } from "@/components/table/fetchFunctions/loadFounders";
import FoundersTable from "@/components/table/tableWrappers/foundersTableWrappers/FoundersTable";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";

export default async function Founders() {
  const { serializedFounders, count } = await api.withRemult(async () => {
    return {
      serializedFounders: serializeFounders(await loadFounders(1, 50)),
      count: await getFoundersCount()
    }
  });

  return (
    <Card>
      <HeaderBox title={texts.founders} />
      <FoundersTable
        initialData={serializedFounders}
        count={count}
      />
    </Card>
  );
}
