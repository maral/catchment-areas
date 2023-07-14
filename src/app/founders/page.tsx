import FoundersTable from "@/components/table/tableWrappers/FoundersTable";
import { Card } from "@tremor/react";
import { api } from "../api/[...remult]/route";
import { loadFounders, serializeFounders } from "@/components/table/fetchFunctions/loadFounders";

export default async function Founders() {
  const serializedFounders = await api.withRemult(async () => {
    return serializeFounders(await loadFounders(1, 10));
  });

  return (
    <Card>
      <FoundersTable initialData={serializedFounders} />
    </Card>
  );
}
