import NextAuth, {
  NextAuthOptions,
  Session,
  getServerSession,
} from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { RemultAdapter } from "../RemultAdapter";
import { User } from "@/entities/User";
import { getRemult } from "../../[...remult]/config";

let authOptions: NextAuthOptions | null = null;

export function getNextAuthOptions(): NextAuthOptions {
  if (authOptions === null) {
    authOptions = {
      providers: [
        AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID || "",
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
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
          return session;
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
  }
  return authOptions;
}

let auth: NextAuthOptions | null = null;

export function getNextAuth() {
  if (auth === null) {
    auth = NextAuth(getNextAuthOptions());
  }
  return auth;
}

export async function getServerSessionWithOptions(): Promise<Session | null> {
  return await getServerSession(getNextAuthOptions());
}
