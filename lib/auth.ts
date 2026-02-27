import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createSupabaseServerClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      majlisId: string | null;
      profile_completed: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    majlisId?: string | null;
    profile_completed?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        member_code: { label: "Member code", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.member_code || !credentials?.password) return null;
        const supabase = createSupabaseServerClient();
        const { data: user, error } = await supabase
          .from("users")
          .select("id, member_code, password_hash, role, majlis_id, name, profile_completed")
          .eq("member_code", credentials.member_code.trim())
          .is("deleted_at", null)
          .single();
        if (error || !user) return null;
        const ok = await bcrypt.compare(credentials.password, user.password_hash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.member_code,
          role: user.role,
          majlis_id: user.majlis_id,
          profile_completed: user.profile_completed ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.id) {
        try {
          const supabase = createSupabaseServerClient();
          const today = new Date().toISOString().slice(0, 10);
          await supabase.from("activity_log").upsert(
            { user_id: user.id, activity_date: today, activity_type: "login" },
            { onConflict: "user_id,activity_date,activity_type" }
          );
        } catch {
          // activity_log table may not exist
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.majlisId = (user as { majlis_id?: string | null }).majlis_id ?? null;
        token.profile_completed = (user as { profile_completed?: boolean }).profile_completed ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "tifl";
        session.user.majlisId = (token.majlisId as string | null) ?? null;
        session.user.profile_completed = (token.profile_completed as boolean) ?? false;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/dashboard";
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
