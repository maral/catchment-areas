import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { texts } from "@/utils/shared/texts";
import AddUserForm from "./AddUserForm";

export default function AddUser() {
  return (
    <Card className="w-1/2 mx-auto my-12">
      <CardHeader>
        <CardTitle>{texts.addUser}</CardTitle>
      </CardHeader>
      <CardContent>
        <AddUserForm />
      </CardContent>
    </Card>
  );
}
