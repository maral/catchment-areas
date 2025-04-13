"use client";

import { signIn } from "next-auth/react";
import { Button } from "../ui/button";

export default function MicrosoftButton() {
  return (
    <Button className="w-full" onClick={() => signIn("azure-ad")}>
      Přihlásit se účtem Microsoft
    </Button>
  );
}
