import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import {
  getFoundersCountByOrp,
  loadFoundersByOrp,
  serializeFounders,
} from "@/components/table/fetchFunctions/loadFounders";
import OrpFoundersTable from "@/components/table/tableWrappers/OrpFounders.table";
import { Orp } from "@/entities/Orp";
import { remult } from "remult";

export default async function OrpPage({
  params: { code },
}: {
  params: { code: string };
}) {
  const { serializedFounders, count, orp } = await api.withRemult(
    async () => {
      const orp = await remult.repo(Orp).findId(Number(code));
      return {
        orp,
        serializedFounders: serializeFounders(
          await loadFoundersByOrp(code, 1, 10)
        ),
        count: await getFoundersCountByOrp(code),
      };
    }
  );

  return (
    <div>
      <HeaderBox title={orp.name} />
      <OrpFoundersTable
        orpCode={code}
        initialData={serializedFounders}
        count={count}
      />
    </div>
  );
}
