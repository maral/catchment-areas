import { api } from "@/app/api/[...remult]/api";
import AnalyticsActions from "@/components/analyticsLayers/AnalyticsActions";
import HeaderBox from "@/components/common/HeaderBox";
import {
  loadUsers,
  serializeUsers,
} from "@/components/table/fetchFunctions/loadUsers";
import UsersTable from "@/components/table/tableWrappers/UsersTable";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Updated import
import { texts } from "@/utils/shared/texts";

export default async function Users() {
  return (
    <Card>
      <CardHeader>
        <HeaderBox title={texts.analyticsLayers}>
          <AnalyticsActions />
        </HeaderBox>
      </CardHeader>
      <CardContent>TODO</CardContent>
    </Card>
  );
}
