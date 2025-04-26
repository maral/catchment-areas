import NextAuth from "next-auth";
import { getRemult } from "./app/api/[...remult]/config";
import { RemultAdapter } from "./app/api/auth/RemultAdapter";
import authConfig from "./auth.config";
import { User } from "./entities/User";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: RemultAdapter(),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user && user.email) {
        const remult = await getRemult();
        const dbUser = await remult.repo(User).findFirst({
          email: user.email,
        });
        token.id = dbUser?.id;
        token.role = dbUser?.role;
      }

      if (token.picture) {
        delete token.picture;
      }

      return token;
    },
  },
});
