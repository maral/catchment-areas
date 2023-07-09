import FoundersTable from "@/components/table/tableWrappers/FoundersTable";
import { Card } from "@tremor/react";
import { api } from "../api/[...remult]/route";
import { remult } from "remult";
import { Founder } from "@/entities/Founder";
import { loadFounders, serializeFounders } from "@/components/table/fetchFunctions/loadFounders";

const foundersRepo = remult.repo(Founder);

export default async function Founders() {
  const founders = await api.withRemult(async () => {
    return serializeFounders(await loadFounders(1, 10));
  });

  return (
    <Card>
      <FoundersTable initialData={founders} />
    </Card>
  );
}
