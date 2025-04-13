import { api } from "@/app/api/[...remult]/api";
import UsersActions from "@/components/UsersActions";
import HeaderBox from "@/components/common/HeaderBox";
import {
  loadUsers,
  serializeUsers,
} from "@/components/table/fetchFunctions/loadUsers";
import UsersTable from "@/components/table/tableWrappers/UsersTable";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Updated import
import { texts } from "@/utils/shared/texts";

export default async function Users() {
  const { serializedUsers } = await api.withRemult(async () => {
    return {
      serializedUsers: serializeUsers(await loadUsers()),
    };
  });

  return (
    <Card>
      <CardHeader>
        <HeaderBox title={texts.users}>
          <UsersActions />
        </HeaderBox>
      </CardHeader>
      <CardContent>
        <UsersTable initialData={serializedUsers} />
      </CardContent>
    </Card>
  );
}
