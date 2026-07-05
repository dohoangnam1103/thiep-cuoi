import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

type GoogleProfile = {
  email?: string | null;
  email_verified?: boolean;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const googleProfile = profile as GoogleProfile | undefined;
      return Boolean(googleProfile?.email && googleProfile.email_verified === true);
    },
  },
});
