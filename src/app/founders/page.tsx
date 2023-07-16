import FoundersTable from "@/components/table/tableWrappers/FoundersTable";
import { Card } from "@tremor/react";
import { api } from "../api/[...remult]/route";
import { loadFounders, serializeFounders, getFoundersCount } from "@/components/table/fetchFunctions/loadFounders";
import HeaderBox from "@/components/common/HeaderBox";
import { texts } from "@/utils/shared/texts";

export default async function Founders() {
  const { serializedFounders, count } = await api.withRemult(async () => {
    return {
      serializedFounders: serializeFounders(await loadFounders(1, 10)),
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
