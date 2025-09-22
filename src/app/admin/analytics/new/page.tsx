import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddAnalyticsForm from "@/components/analyticsData/AddAnalyticsForm";
import { texts } from "@/utils/shared/texts";

export default function AddAnalytics() {
  return (
    <Card className="w-1/2 mx-auto my-12">
      <CardHeader>
        <CardTitle>{texts.addAnalyticsData}</CardTitle>
      </CardHeader>
      <CardContent>
        <AddAnalyticsForm />
      </CardContent>
    </Card>
  );
}
