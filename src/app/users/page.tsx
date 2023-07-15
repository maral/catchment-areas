import UsersActions from "@/components/UsersActions";
import UsersTable from "@/components/table/tableWrappers/UsersTable";
import { Card } from "@tremor/react";
import { api } from "../api/[...remult]/route";
import { loadUsers, serializeUsers } from "@/components/table/fetchFunctions/loadUsers";
import { texts } from "@/utils/shared/texts";
import HeaderBox from "@/components/common/HeaderBox";


export default async function Users() {
  const serializedUsers = await api.withRemult(async () => {
    return serializeUsers(await loadUsers(1, 10));
  });

  return (
    <Card>
      <HeaderBox title={texts.users}>
        <UsersActions />
      </HeaderBox>
      <UsersTable initialData={serializedUsers} />
    </Card>
  );
}
