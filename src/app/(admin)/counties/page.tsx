import {
  getCountiesCount,
  loadCounties,
  serializeCounties,
} from "@/components/table/fetchFunctions/loadCounties";
import { api } from "@/app/api/[...remult]/api";
import { Card } from "@tremor/react";
import HeaderBox from "@/components/common/HeaderBox";
import { texts } from "@/utils/shared/texts";
import CountiesTable from "@/components/table/tableWrappers/CountiesTable";

export default async function Counties() {
  const { serializedCounties, count } = await api.withRemult(async () => {
    return {
      serializedCounties: serializeCounties(await loadCounties(1, 50)),
      count: await getCountiesCount(),
    };
  });

  return (
    <Card>
      <HeaderBox title={texts.counties} />
      <CountiesTable initialData={serializedCounties} count={count} />
    </Card>
  );
}
