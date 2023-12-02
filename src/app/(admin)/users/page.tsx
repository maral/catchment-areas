import { api } from "@/app/api/[...remult]/api";
import UsersActions from "@/components/UsersActions";
import UsersTable from "@/components/table/tableWrappers/UsersTable";
import HeaderBox from "@/components/common/HeaderBox";
import { getUsersCount, loadUsers, serializeUsers } from "@/components/table/fetchFunctions/loadUsers";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";


export default async function Users() {
  const { serializedUsers, count } = await api.withRemult(async () => {
    return {
      serializedUsers: serializeUsers(await loadUsers(1, 50)),
      count: await getUsersCount()
    }
  });

  return (
    <Card>
      <HeaderBox title={texts.users}>
        <UsersActions />
      </HeaderBox>
      <UsersTable
        initialData={serializedUsers}
        count={count}
      />
    </Card>
  );
}
