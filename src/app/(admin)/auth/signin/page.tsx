"use client";

import MicrosoftButton from "@/components/buttons/MicrosoftButton";
import { routes } from "@/utils/shared/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Updated import
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
        <Card className="w-96 mb-40">
          <CardHeader>
            <CardTitle className="my-2 mx-auto inline-block">Přihlášení</CardTitle>
          </CardHeader>
          <CardContent>
            <MicrosoftButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
