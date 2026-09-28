import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { queryOne, query } from "./db";
import bcrypt from "bcryptjs";

export interface DBUser {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  email: string;
  telefono: string | null;
  rol: "admin" | "cliente" | "inventarios" | "general";
  password_hash: string | null;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
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
        const user = await queryOne<DBUser>(
          "SELECT * FROM usuarios WHERE email = $1 AND activo = true",
          [credentials.email]
        );
        if (!user || !user.password_hash) return null;
        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.nombre, rol: user.rol };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await queryOne<DBUser>(
          "SELECT id FROM usuarios WHERE email = $1",
          [user.email]
        );
        if (!existing) {
          const nameParts = (user.name ?? "").split(" ");
          const nombre = nameParts[0] ?? "Usuario";
          const apellido = nameParts.slice(1).join(" ") || "Google";
          await query(
            `INSERT INTO usuarios (nombre, apellido_paterno, email, rol)
             VALUES ($1, $2, $3, 'cliente')`,
            [nombre, apellido, user.email]
          );
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await queryOne<DBUser>(
          "SELECT id, rol FROM usuarios WHERE email = $1",
          [user.email]
        );
        token.id = dbUser?.id ?? user.id;
        token.rol = dbUser?.rol ?? "cliente";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; rol: string }).id = token.id as string;
        (session.user as { id: string; rol: string }).rol = token.rol as string;
      }
      return session;
    },
  },
};
