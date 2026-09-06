import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no Atlas Quiz — duelos 1x1 de geografia" },
      {
        name: "description",
        content:
          "Crie sua conta ou entre para desafiar outros jogadores em duelos 1x1 de geografia no mapa-múndi.",
      },
      { property: "og:title", content: "Entrar no Atlas Quiz" },
      {
        property: "og:description",
        content: "Conta gratuita para jogar duelos 1x1 de geografia contra outros jogadores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/duelo", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/duelo",
            data: { username: username.trim() || email.split("@")[0] },
          },
        });
        if (err) throw err;
        if (data.session) navigate({ to: "/duelo", replace: true });
        else setMessage("Confira seu e-mail para confirmar a conta e depois entre.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate({ to: "/duelo", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/duelo",
    });
    if (result.error) {
      setError("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/duelo", replace: true });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-4 py-10">
      <div>
        <Link to="/" className="text-xs uppercase tracking-[0.35em] text-accent">
          ← Atlas Quiz
        </Link>
        <h1 className="font-display mt-2 text-3xl font-bold">
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua conta guarda seu apelido e libera os duelos 1x1.
        </p>
      </div>

      <form onSubmit={submit} className="panel flex flex-col gap-3 p-5">
        {mode === "signup" && (
          <Field label="Apelido">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              placeholder="Como quer aparecer no duelo"
              className="input-field"
            />
          </Field>
        )}
        <Field label="E-mail">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </Field>

        {error && <p className="text-sm text-wrong">{error}</p>}
        {message && <p className="text-sm text-correct">{message}</p>}

        <button
          type="submit"
          disabled={busy}
          className="font-display mt-1 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>

        <button
          type="button"
          onClick={google}
          className="w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent/10"
        >
          Continuar com o Google
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="text-sm text-accent underline-offset-4 hover:underline"
        >
          {mode === "signin" ? "Não tem conta? Criar agora" : "Já tenho conta"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
