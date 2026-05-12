import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/app/lib/supabase-server";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { data: dealer } = await supabaseServer
          .from("dealers")
          .select("*")
          .eq("email", credentials.email)
          .eq("status", "active")
          .not("password", "is", null)
          .single();

        if (!dealer || !dealer.password) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password,
          dealer.password,
        );

        if (!valid) {
          return null;
        }

        return {
          id: String(dealer.id),
          name: dealer.name,
          email: dealer.email,
        };
      },
    }),
  ],

  callbacks: {
    // ── JWT ─────────────────────────────────────────────
    async jwt({ token, user }) {
      // On login
      if (user) {
        token.dbId = Number(user.id);
        token.provider = "credentials";
      }

      // Always fetch latest dealer data
      if (token.dbId) {
        const { data } = await supabaseServer
          .from("dealers")
          .select(
            "id, name, email, role, status, slug, short_name, area, phone, avatar_url",
          )
          .eq("id", token.dbId)
          .single();

        if (data) {
          token.dbId = data.id;
          token.name = data.name;
          token.email = data.email;
          token.role = data.role;
          token.status = data.status;
          token.slug = data.slug;
          token.shortName = data.short_name;
          token.area = data.area ?? null;
          token.phone = data.phone ?? null;
          token.avatar = data.avatar_url ?? null;
        }
      }

      return token;
    },

    // ── Session ────────────────────────────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.dbId as number;
        session.user.role = token.role as "admin" | "dealer";
        session.user.status = token.status as string;
        session.user.slug = token.slug as string;
        session.user.shortName = token.shortName as string;
        session.user.area = token.area as string | null;
        session.user.phone = token.phone as string | null;
        session.user.avatar = token.avatar as string | null;
        session.user.provider = token.provider as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/backoffice-login",
    error: "/backoffice-login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
