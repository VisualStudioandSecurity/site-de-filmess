"import React, { useState, useEffect } from \"react\";
import { Link, useNavigate, useLocation } from \"react-router-dom\";
import { Search, Film, Menu, X } from \"lucide-react\";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState(\"\");
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener(\"scroll\", onScroll);
    return () => window.removeEventListener(\"scroll\", onScroll);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/catalogo?q=${encodeURIComponent(q.trim())}`);
  };

  const active = (p) => loc.pathname === p;

  return (
    <header
      data-testid=\"site-header\"
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${
        scrolled ? \"backdrop-blur-2xl bg-[#050505]/85 border-b border-white/5\" : \"bg-transparent\"
      }`}
    >
      <div className=\"max-w-7xl mx-auto px-6 py-4 flex items-center gap-6\">
        <Link to=\"/\" data-testid=\"logo-link\" className=\"flex items-center gap-2 group\">
          <div className=\"w-9 h-9 rounded-md gradient-red flex items-center justify-center shadow-[0_0_20px_rgba(229,9,20,0.4)]\">
            <Film className=\"w-5 h-5 text-white\" />
          </div>
          <span className=\"font-display font-black text-xl tracking-tighter uppercase\">
            Movie<span className=\"text-[#E50914]\">Hub</span>
          </span>
        </Link>

        <nav className=\"hidden md:flex items-center gap-6 text-sm font-medium\">
          <Link data-testid=\"nav-home\" to=\"/\" className={active(\"/\") ? \"text-white\" : \"text-neutral-400 hover:text-white transition-colors\"}>Início</Link>
          <Link data-testid=\"nav-catalog\" to=\"/catalogo\" className={active(\"/catalogo\") ? \"text-white\" : \"text-neutral-400 hover:text-white transition-colors\"}>Catálogo</Link>
          <Link data-testid=\"nav-lancamentos\" to=\"/catalogo?section=featured\" className=\"text-neutral-400 hover:text-white transition-colors\">Lançamentos</Link>
        </nav>

        <form onSubmit={submit} className=\"ml-auto hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 min-w-[280px] focus-within:border-[#E50914] transition-colors\">
          <Search className=\"w-4 h-4 text-neutral-500 mr-2\" />
          <input
            data-testid=\"header-search-input\"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder=\"Buscar filmes...\"
            className=\"bg-transparent flex-1 text-sm outline-none placeholder:text-neutral-500\"
          />
        </form>

        <Link
          to=\"/admin/login\"
          data-testid=\"admin-link\"
          className=\"hidden md:inline-block text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 hover:text-[#FFB800] transition-colors\"
        >
          Admin
        </Link>

        <button
          data-testid=\"mobile-menu-toggle\"
          onClick={() => setMobileOpen((v) => !v)}
          className=\"md:hidden ml-auto p-2 text-white\"
        >
          {mobileOpen ? <X className=\"w-5 h-5\" /> : <Menu className=\"w-5 h-5\" />}
        </button>
      </div>

      {mobileOpen && (
        <div className=\"md:hidden bg-[#050505] border-t border-white/5 px-6 py-4 space-y-3\">
          <form onSubmit={submit} className=\"flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2\">
            <Search className=\"w-4 h-4 text-neutral-500 mr-2\" />
            <input
              data-testid=\"mobile-search-input\"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder=\"Buscar filmes...\"
              className=\"bg-transparent flex-1 text-sm outline-none placeholder:text-neutral-500\"
            />
          </form>
          <Link to=\"/\" onClick={() => setMobileOpen(false)} className=\"block text-sm py-2\">Início</Link>
          <Link to=\"/catalogo\" onClick={() => setMobileOpen(false)} className=\"block text-sm py-2\">Catálogo</Link>
          <Link to=\"/admin/login\" onClick={() => setMobileOpen(false)} className=\"block text-xs uppercase tracking-[0.2em] text-neutral-500 py-2\">Admin</Link>
        </div>
      )}
    </header>
  );
}
"
