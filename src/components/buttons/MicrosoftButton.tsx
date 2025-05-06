"use client";

import { signIn } from "next-auth/react";
import { Button } from "../ui/button";

export default function MicrosoftButton() {
  return (
    <Button
      className="w-full"
      onClick={() =>
        signIn("microsoft-entra-id", { redirectTo: "/admin/elementary" })
      }
    >
      Přihlásit se účtem Microsoft
    </Button>
  );
}
