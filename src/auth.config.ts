import MicrosoftEntraIdProvider from "next-auth/providers/microsoft-entra-id";

import type { NextAuthConfig } from "next-auth";
import { routes } from "./utils/shared/constants";

export default {
  providers: [
    MicrosoftEntraIdProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      authorization: {
        params: { scope: "openid email profile User.Read  offline_access" },
      },
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
