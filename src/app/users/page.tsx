import UsersActions from "@/components/UsersActions";
import UsersTable from "@/components/table/tableWrappers/UsersTable";
import { Card } from "@tremor/react";
import { api } from "../api/[...remult]/route";
import { loadUsers, serializeUsers } from "@/components/table/fetchFunctions/loadUsers";


export default async function Users() {
  const serializedUsers = await api.withRemult(async () => {
    return serializeUsers(await loadUsers(1, 10));
  });

  return (
    <Card>
      <div className="flex flex-row-reverse mb-4">
        <UsersActions />
      </div>
      <UsersTable initialData={serializedUsers} />
    </Card>
  );
}
