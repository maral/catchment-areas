import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import AzureADProvider from 'next-auth/providers/azure-ad';
import { RemultAdapter } from "../RemultAdapter";



export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      // tenantId: process.env.AZURE_AD_TENANT_ID || "",
      authorization: {
        params: { scope: 'openid email profile User.Read  offline_access' },
      },
    })
  ],
  adapter: RemultAdapter(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const auth = NextAuth(authOptions);

export const getServerSessionWithOptions = async () => await getServerSession(authOptions);


export { auth as GET, auth as POST };
