import UsersActions from "@/components/UsersActions";
import UsersTable from "@/components/table/tableWrappers/UsersTable";
import { Card } from "@tremor/react";


export default function Users() {
  return (
    <Card>
      <div className="flex flex-row-reverse mb-4">
        <UsersActions />
      </div>
      <UsersTable />
    </Card>
  );
}
