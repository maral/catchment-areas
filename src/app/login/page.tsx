"use client";

import { Button, Card, TextInput } from "@tremor/react";
import { Colors } from "@/styles/Themes";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const onLoginBtnClick = () => {
    router.push("/test");
  };

  return (
    <div className="grow flex flex-col justify-center">
      <div className="flex justify-center content-center">
        <Card className="w-96 mb-40 flex flex-wrap">
          <h1 className="text-2xl my-2 mx-auto inline-block">Přihlášení</h1>
          <TextInput className="w-full my-2" placeholder="Username" />
          <TextInput
            className="w-full my-2"
            placeholder="Password"
            type="password"
          />
          <Button
            className="w-full my-2"
            color={Colors.Primary}
            onClick={onLoginBtnClick}
          >
            Přihlásit
          </Button>
        </Card>
      </div>
    </div>
  );
}
