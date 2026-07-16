"import React, { useState } from \"react\";
import { useNavigate } from \"react-router-dom\";
import { useAuth } from \"@/lib/auth\";
import { formatErr } from \"@/lib/api\";
import { Lock, Film } from \"lucide-react\";

export default function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(\"admin@moviehub.com\");
  const [password, setPassword] = useState(\"\");
  const [err, setErr] = useState(\"\");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(\"\"); setBusy(true);
    try {
      await login(email, password);
      nav(\"/admin\");
    } catch (e) {
      setErr(formatErr(e.response?.data?.detail) || \"Erro no login\");
    } finally { setBusy(false); }
  };

  return (
    <div data-testid=\"admin-login-page\" className=\"min-h-screen flex items-center justify-center px-6 pt-16\">
      <form onSubmit={submit} className=\"w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl\">
        <div className=\"flex items-center gap-2 mb-6\">
          <div className=\"w-10 h-10 rounded-md gradient-red flex items-center justify-center\">
            <Film className=\"w-5 h-5\" />
          </div>
          <div>
            <div className=\"text-xs uppercase tracking-widest text-neutral-500\">MovieHub</div>
            <div className=\"font-display text-xl font-black tracking-tighter uppercase\">Admin</div>
          </div>
        </div>

        <h1 className=\"text-2xl font-bold mb-1 tracking-tight\">Bem-vindo de volta</h1>
        <p className=\"text-sm text-neutral-500 mb-6\">Acesse o painel para gerenciar filmes e comentários.</p>

        {err && <div data-testid=\"login-error\" className=\"mb-4 p-3 bg-[#E50914]/10 border border-[#E50914]/30 rounded-md text-sm text-[#E50914]\">{err}</div>}

        <label className=\"block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5\">Email</label>
        <input data-testid=\"login-email\" type=\"email\" required value={email} onChange={(e) => setEmail(e.target.value)}
          className=\"w-full mb-4 bg-[#050505] border border-white/10 rounded-md px-4 py-3 text-sm outline-none focus:border-[#E50914]\" />

        <label className=\"block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5\">Senha</label>
        <input data-testid=\"login-password\" type=\"password\" required value={password} onChange={(e) => setPassword(e.target.value)}
          className=\"w-full mb-6 bg-[#050505] border border-white/10 rounded-md px-4 py-3 text-sm outline-none focus:border-[#E50914]\" />

        <button data-testid=\"login-submit\" disabled={busy} className=\"w-full inline-flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#B80710] disabled:opacity-50 text-white font-bold px-5 py-3 rounded-full transition-colors\">
          <Lock className=\"w-4 h-4\" /> {busy ? \"Entrando...\" : \"Entrar\"}
        </button>
      </form>
    </div>
  );
