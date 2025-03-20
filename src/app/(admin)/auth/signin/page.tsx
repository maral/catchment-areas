"use client";

import MicrosoftButton from "@/components/buttons/MicrosoftButton";
import { routes } from "@/utils/shared/constants";
import { Card } from "@tremor/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  // redirect to home if already logged in
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session && session.status === "authenticated") {
      router.push(routes.elementary);
    }
  }, [session, router]);

  return (
    <div className="grow flex flex-col justify-center">
      <div className="flex justify-center content-center">
        <Card className="w-96 mb-40 flex flex-wrap">
          <h1 className="text-2xl my-2 mx-auto inline-block">Přihlášení</h1>
          <MicrosoftButton />
        </Card>
      </div>
    </div>
  );
}
