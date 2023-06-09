import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import AzureADB2CProvider from "next-auth/providers/azure-ad-b2c";
import AzureADProvider from 'next-auth/providers/azure-ad';
import { UserInfo } from "remult";
import { api } from "../../[...remult]/route";

const validUsers: UserInfo[] = [
  { id: "1", name: "Jane" },
  { id: "2", name: "Steve" },
];
export function findUserById(id: string | undefined) {
  return validUsers.find((user) => user.id === id);
}

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        name: {
          placeholder: "Try Steve or Jane",
        },
      },
      authorize: (info) =>
        validUsers.find((user) => user.name === info?.name) || null,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "",
      authorization: {
        params: { scope: 'openid email profile User.Read  offline_access' },
      },
    })
  ],
  callbacks: {
    // session: ({ session, token }) => ({
    //   ...session,
    //   user: findUserById(token?.sub),
    // }),
  },
};

const auth = NextAuth(authOptions);


export { auth as GET, auth as POST };
