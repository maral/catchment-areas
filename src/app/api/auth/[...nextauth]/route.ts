import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { RemultAdapter, getRemult } from "../RemultAdapter";
import { User } from "@/entities/User";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      // tenantId: process.env.AZURE_AD_TENANT_ID || "",
      authorization: {
        params: { scope: "openid email profile User.Read  offline_access" },
      },
    }),
  ],
  adapter: RemultAdapter(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "";
      }
      return session
    },
    async jwt({ token, user }) {
      if (user && user.email) {
        const remult = await getRemult();
        const dbUser = await remult.repo(User).findFirst({
          email: user.email,
        });
        token.id = dbUser?.id;
        token.role = dbUser?.role;
      }
      return token;
    },
  },
};

const auth = NextAuth(authOptions);

export const getServerSessionWithOptions = async () =>
  await getServerSession(authOptions);

export { auth as GET, auth as POST };
