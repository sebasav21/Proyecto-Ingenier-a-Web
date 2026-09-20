import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/tienda";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Crear perfil si no existe (primer login con OAuth)
      const { createAdminClient } = await import("@/lib/supabase/server");
      const admin = createAdminClient();

      const { data: perfil } = await admin
        .from("perfiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!perfil) {
        const nombre = data.user.user_metadata?.full_name?.split(" ")[0] ?? "Usuario";
        const apellido = data.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ?? null;

        await admin.from("perfiles").insert({
          id: data.user.id,
          nombre,
          apellido_paterno: apellido,
          email: data.user.email!,
          rol: "cliente",
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
