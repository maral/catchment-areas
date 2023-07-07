import FoundersTable from "@/components/table/tableWrappers/FoundersTable";
import { Card } from "@tremor/react";
import { api } from "../api/[...remult]/route";
import { remult } from "remult";
import { Founder } from "@/entities/Founder";

const foundersRepo = remult.repo(Founder);

export default async function Founders() {
  const founders = await api.withRemult(async () => {
    const founders = await foundersRepo.find({
      limit: 10,
      page: 1,
      orderBy: { shortName: "asc" },
      load: (f) => [f.city!],
    });
    console.log("repo", foundersRepo);
    return foundersRepo.toJson(founders);
  }
  );

  return (
    <Card>
      <FoundersTable initialData={founders} />
    </Card>
  );
}
