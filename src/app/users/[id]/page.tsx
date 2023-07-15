'use client';

import Header from "@/components/common/Header";
import { Role } from "@/entities/User";
import { Colors } from "@/styles/Themes";
import { texts } from "@/utils/shared/texts";
import { Button, Card, Select, SelectItem, Subtitle, TextInput } from "@tremor/react";
import { useState } from "react";

export default function UserDetail({
  params: { id },
}: {
  params: { id: string },
}) {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [selectedRole, setSelectedRole ] = useState<Role>(Role.User);

  const onRoleChange = (value: string | number) => {
    setSelectedRole(value as Role);
  }

  return (
    <Card>
      <div className="w-1/3 mx-auto my-12">
        <div className="flex justify-center mb-10">
          <Header className="shrink">
            {texts.editUser}
          </Header>
        </div>
          <Subtitle>
            {texts.firstName}
          </Subtitle>
          <TextInput
            className="mb-6 mt-2"
            placeholder={texts.fillOutFirstName}
          />
          <Subtitle>
            {texts.lastName}
          </Subtitle>
          <TextInput
            className="mb-6 mt-2"
            placeholder={texts.fillOutLastName}
          />
          <Subtitle>
            {texts.email}
          </Subtitle>
          <TextInput
            className="mb-6 mt-2"
            placeholder={texts.fillOutEmail}
          />
          <Subtitle>
            {texts.password}
          </Subtitle>
          <TextInput
            className="mb-6 mt-2"
            placeholder={texts.fillOutPassword}
          />
          <Subtitle>
            {texts.role}
          </Subtitle>
          <Select
            className="w-full mb-6 mt-2"
            value={selectedRole}
            onValueChange={onRoleChange}
          >
            <SelectItem value={Role.User}>
              {texts.user}
            </SelectItem>
            <SelectItem value={Role.Admin}>
              {texts.admin}
            </SelectItem>
          </Select>
          <Button
            className="w-full mt-4"
            color={Colors.Primary}
          >
            {texts.save}
          </Button>
      </div>
    </Card>
  );
}
