"use client";

import { Colors } from "@/styles/Themes";
import { Button } from "@tremor/react";
import { signIn } from "next-auth/react";

export default function MicrosoftButton() {
  return (
    <Button
      className="w-full my-2"
      color={Colors.Primary}
      onClick={() => signIn("azure-ad")}
    >
      Přihlásit se účtem Microsoft 🪟
    </Button>
  );
}
