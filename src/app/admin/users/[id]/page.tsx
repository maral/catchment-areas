import Header from "@/components/common/Header";
import { User } from "@/entities/User";
import { texts } from "@/utils/shared/texts";
import { remult } from "remult";
import { api } from "../../../api/[...remult]/api";
import EditUserForm from "./EditUserForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Updated import

export default async function UserDetail(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;

  const {
    id
  } = params;

  const user = await api.withRemult(async () => {
    return await remult.repo(User).findId(id);
  });

  return (
    <Card className="w-1/2 mx-auto my-12">
      <CardHeader>
        <CardTitle>{texts.editUser}</CardTitle>
      </CardHeader>
      <CardContent>
        <EditUserForm
          user={{
            id,
            name: user.name ?? "",
            email: user.email,
            futureEmail: user.futureEmail,
            role: user.role,
          }}
        />
      </CardContent>
    </Card>
  );
}
