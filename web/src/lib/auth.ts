import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) return null;

        // 1. Check Guard table
        const guard = await db.guard.findUnique({
          where: { username },
          include: { assignedGate: true },
        });

        if (guard && guard.isActive) {
          const valid = await bcrypt.compare(password, guard.passwordHash);
          if (valid) {
            return {
              id: guard.id,
              name: guard.name,
              role: "guard",
              gateId: guard.assignedGateId ?? undefined,
              gateName: guard.assignedGate?.name ?? undefined,
            };
          }
        }

        // 2. Check Resident table (includes secretaries)
        const resident = await db.resident.findUnique({
          where: { username: username },
          include: { flat: true },
        });

        if (resident && resident.status === "active" && resident.passwordHash) {
          const valid = await bcrypt.compare(password, resident.passwordHash);
          if (valid) {
            return {
              id: resident.id,
              name: resident.name,
              email: resident.email ?? undefined,
              role: resident.role, // "resident" | "secretary"
              flatId: resident.flatId,
              flatNumber: resident.flat.flatNumber,
            };
          }
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.gateId = user.gateId;
        token.gateName = user.gateName;
        token.flatId = user.flatId;
        token.flatNumber = user.flatNumber;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.gateId = token.gateId as string | undefined;
        session.user.gateName = token.gateName as string | undefined;
        session.user.flatId = token.flatId as string | undefined;
        session.user.flatNumber = token.flatNumber as string | undefined;
      }
      return session;
    },
  },
});
