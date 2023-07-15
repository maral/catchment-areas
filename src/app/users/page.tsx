import UsersActions from "@/components/UsersActions";
import UsersTable from "@/components/table/tableWrappers/UsersTable";
import { Card } from "@tremor/react";
import { api } from "../api/[...remult]/route";
import { loadUsers, serializeUsers, getUsersCount } from "@/components/table/fetchFunctions/loadUsers";
import { texts } from "@/utils/shared/texts";
import HeaderBox from "@/components/common/HeaderBox";


export default async function Users() {
  const { serializedUsers } = await api.withRemult(async () => {
    return {
      serializedUsers: serializeUsers(await loadUsers(1, 10)),
      // count: await getUsersCount()
    }
  });

  return (
    <Card>
      <HeaderBox title={texts.users}>
        <UsersActions />
      </HeaderBox>
      <UsersTable
        initialData={serializedUsers}
        // count={count}
      />
    </Card>
  );
}
