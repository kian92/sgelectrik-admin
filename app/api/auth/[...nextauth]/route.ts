import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/app/lib/supabase-server";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: dealer } = await supabaseServer
          .from("dealers")
          .select("*")
          .eq("email", credentials.email)
          .eq("status", "active")
          .not("password", "is", null)
          .single();

        if (!dealer || !dealer.password) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          dealer.password,
        );
        if (!valid) return null;

        return {
          id: String(dealer.id),
          name: dealer.name,
          email: dealer.email,
        };
      },
    }),
  ],

  callbacks: {
    // ── On sign in: upsert Google dealers into dealers table ──────────────
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const { data: existing } = await supabaseServer
          .from("dealers")
          .select("id")
          .eq("email", user.email!)
          .single();

        if (!existing) {
          // Auto-generate a slug from name + timestamp
          const slug =
            (user.name ?? "dealer")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "") +
            "-" +
            Date.now();

          await supabaseServer.from("dealers").insert({
            slug,
            name: user.name,
            short_name: user.name,
            email: user.email,
            avatar_url: user.image,
            provider: "google",
            provider_id: account.providerAccountId,
            role: "dealer", // default role for Google sign-ins
            status: "active",
          });
        }
      }
      return true;
    },

    // ── Build JWT with dealer-specific fields ─────────────────────────────
    async jwt({ token, user, account }) {
      // On login
      if (user) {
        if (account?.provider === "credentials") {
          token.dbId = Number(user.id);
        }

        if (account?.provider === "google") {
          const { data } = await supabaseServer
            .from("dealers")
            .select("id")
            .eq("email", user.email!)
            .single();

          token.dbId = data?.id ?? null;
        }

        token.provider = account?.provider;
      }

      // Always fetch latest dealer data on every request
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

    // ── Expose dealer fields on the session ───────────────────────────────
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
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
