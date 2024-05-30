import Header from "@/components/common/Header";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";
import AddUserForm from "./AddUserForm";

export default function AddUser() {
  return (
    <Card>
      <div className="w-1/3 mx-auto my-12">
        <div className="flex justify-center mb-10">
          <Header className="shrink">{texts.addUser}</Header>
        </div>
        <AddUserForm />
      </div>
    </Card>
  );
}
