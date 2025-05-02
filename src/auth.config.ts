import MicrosoftEntraIdProvider from "next-auth/providers/microsoft-entra-id";

import type { NextAuthConfig } from "next-auth";
import { routes } from "./utils/shared/constants";

export default {
  providers: [
    MicrosoftEntraIdProvider({
      authorization: {
        params: { scope: "openid email profile User.Read  offline_access" },
      },
      checks: [],
    }),
  ],
  pages: {
    signIn: routes.signIn,
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
