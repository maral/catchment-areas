import Header from "@/components/common/Header";
import { User } from "@/entities/User";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";
import { remult } from "remult";
import { api } from "../../../api/[...remult]/api";
import EditUserForm from "./EditUserForm";

export default async function UserDetail({
  params: { id },
}: {
  params: { id: string };
}) {
  const user = await api.withRemult(async () => {
    return await remult.repo(User).findId(id);
  });

  return (
    <Card>
      <div className="w-1/3 mx-auto my-12">
        <div className="flex justify-center mb-10">
          <Header className="shrink">{texts.editUser}</Header>
        </div>
        <EditUserForm
          user={{
            id,
            name: user.name ?? "",
            email: user.email,
            futureEmail: user.futureEmail,
            role: user.role,
          }}
        />
      </div>
    </Card>
  );
}
