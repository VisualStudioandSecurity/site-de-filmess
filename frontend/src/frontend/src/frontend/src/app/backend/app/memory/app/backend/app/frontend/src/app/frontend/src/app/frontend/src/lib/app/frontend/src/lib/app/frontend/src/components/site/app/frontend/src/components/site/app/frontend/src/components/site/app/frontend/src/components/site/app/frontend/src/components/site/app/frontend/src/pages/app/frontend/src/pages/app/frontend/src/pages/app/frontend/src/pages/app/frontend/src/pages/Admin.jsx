"import React, { useEffect, useState } from \"react\";
import { useNavigate } from \"react-router-dom\";
import { useAuth } from \"@/lib/auth\";
import { api, formatErr, posterUrl, BACKEND_URL } from \"@/lib/api\";
import { toast } from \"sonner\";
import { LogOut, Plus, Trash2, Edit, Eye, MessageSquare, Film as FilmIcon, TrendingUp, Upload, X, Check } from \"lucide-react\";

const EMPTY = {
  title: \"\", original_title: \"\", synopsis: \"\", year: new Date().getFullYear(),
  duration_min: 90, genres: [], language: \"Português\", rating: 7.0,
  poster_url: \"\", backdrop_url: \"\", trailer_url: \"\",
  sources: [{ label: \"Servidor 1\", url: \"\" }],
  featured: false, trending: false,
};

function AdSection() {
  const [cfg, setCfg] = useState({ header_html: \"\", sidebar_html: \"\", in_content_html: \"\", pre_player_html: \"\" });
  useEffect(() => { api.get(\"/ads/config\").then(({ data }) => setCfg(data)); }, []);
  const save = async () => {
    try {
      await api.put(\"/ads/config\", cfg);
      toast.success(\"Anúncios salvos\");
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };
  return (
    <div data-testid=\"ads-section\" className=\"bg-[#111] border border-white/5 rounded-xl p-6\">
      <h3 className=\"font-display text-xl font-bold uppercase tracking-tight mb-4\">Slots de Anúncio</h3>
      {[\"header\", \"sidebar\", \"in_content\", \"pre_player\"].map((k) => (
        <div key={k} className=\"mb-4\">
          <label className=\"block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5\">{k.replace(\"_\", \" \")}</label>
          <textarea
            data-testid={`ad-${k}`}
            rows={2}
            placeholder=\"Cole aqui código HTML de anúncio (AdSense, banner...)\"
            value={cfg[`${k}_html`] || \"\"}
            onChange={(e) => setCfg({ ...cfg, [`${k}_html`]: e.target.value })}
            className=\"w-full bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-xs font-mono outline-none focus:border-[#E50914]\"
          />
        </div>
      ))}
      <button data-testid=\"ads-save\" onClick={save} className=\"bg-[#E50914] hover:bg-[#B80710] font-bold text-sm px-4 py-2 rounded-full transition-colors\">Salvar Anúncios</button>
    </div>
  );
}

function MovieForm({ initial, onCancel, onSaved }) {
  const [f, setF] = useState({ ...EMPTY, ...(initial || {}) });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append(\"file\", file);
    try {
      const { data } = await api.post(\"/upload/poster\", fd, { headers: { \"Content-Type\": \"multipart/form-data\" } });
      setF({ ...f, poster_url: data.url });
      toast.success(\"Poster enviado\");
    } catch (e) { toast.error(formatErr(e.response?.data?.detail) || \"Erro\"); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...f,
        year: Number(f.year), duration_min: Number(f.duration_min), rating: Number(f.rating),
        genres: Array.isArray(f.genres) ? f.genres : String(f.genres).split(\",\").map((s) => s.trim()).filter(Boolean),
        sources: f.sources.filter((s) => s.url),
      };
      if (initial?.id) await api.put(`/movies/${initial.id}`, payload);
      else await api.post(\"/movies\", payload);
      toast.success(initial?.id ? \"Filme atualizado\" : \"Filme criado\");
      onSaved();
    } catch (e) { toast.error(formatErr(e.response?.data?.detail) || \"Erro\"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} data-testid=\"movie-form\" className=\"bg-[#111] border border-white/10 rounded-xl p-6 space-y-4\">
      <div className=\"flex items-center justify-between\">
        <h3 className=\"font-display text-xl font-bold uppercase tracking-tight\">{initial?.id ? \"Editar filme\" : \"Novo filme\"}</h3>
        <button type=\"button\" onClick={onCancel} className=\"text-neutral-500 hover:text-white\"><X className=\"w-4 h-4\" /></button>
      </div>

      <div className=\"grid md:grid-cols-2 gap-3\">
        <input data-testid=\"mf-title\" required placeholder=\"Título\" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className=\"bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
        <input placeholder=\"Título original\" value={f.original_title} onChange={(e) => setF({ ...f, original_title: e.target.value })} className=\"bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
      </div>
      <textarea data-testid=\"mf-synopsis\" rows={3} placeholder=\"Sinopse\" value={f.synopsis} onChange={(e) => setF({ ...f, synopsis: e.target.value })} className=\"w-full bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914] resize-none\" />

      <div className=\"grid md:grid-cols-4 gap-3\">
        <input data-testid=\"mf-year\" type=\"number\" placeholder=\"Ano\" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} className=\"bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
        <input type=\"number\" placeholder=\"Duração (min)\" value={f.duration_min} onChange={(e) => setF({ ...f, duration_min: e.target.value })} className=\"bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
        <input type=\"number\" step=\"0.1\" placeholder=\"Nota\" value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })} className=\"bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
        <input placeholder=\"Idioma\" value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })} className=\"bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
      </div>

      <input placeholder=\"Gêneros (separados por vírgula)\" value={Array.isArray(f.genres) ? f.genres.join(\", \") : f.genres} onChange={(e) => setF({ ...f, genres: e.target.value })} className=\"w-full bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />

      <div className=\"grid md:grid-cols-2 gap-3\">
        <div>
          <label className=\"block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5\">Poster URL</label>
          <div className=\"flex gap-2\">
            <input data-testid=\"mf-poster-url\" placeholder=\"https://... ou faça upload\" value={f.poster_url} onChange={(e) => setF({ ...f, poster_url: e.target.value })} className=\"flex-1 bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
            <label className=\"inline-flex items-center gap-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md px-3 py-2 text-xs cursor-pointer\">
              <Upload className=\"w-3.5 h-3.5\" />{uploading ? \"...\" : \"Upload\"}
              <input type=\"file\" accept=\"image/*\" className=\"hidden\" onChange={upload} data-testid=\"mf-poster-upload\" />
            </label>
          </div>
        </div>
        <div>
          <label className=\"block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5\">Backdrop URL</label>
          <input placeholder=\"https://...\" value={f.backdrop_url} onChange={(e) => setF({ ...f, backdrop_url: e.target.value })} className=\"w-full bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
        </div>
      </div>

      <div>
        <label className=\"block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5\">Servidores de Stream (embed URLs)</label>
        {f.sources.map((s, i) => (
          <div key={i} className=\"flex gap-2 mb-2\">
            <input placeholder=\"Nome\" value={s.label} onChange={(e) => { const ns = [...f.sources]; ns[i] = { ...ns[i], label: e.target.value }; setF({ ...f, sources: ns }); }} className=\"w-40 bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
            <input placeholder=\"URL embed\" value={s.url} onChange={(e) => { const ns = [...f.sources]; ns[i] = { ...ns[i], url: e.target.value }; setF({ ...f, sources: ns }); }} className=\"flex-1 bg-[#050505] border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-[#E50914]\" />
            <button type=\"button\" onClick={() => setF({ ...f, sources: f.sources.filter((_, idx) => idx !== i) })} className=\"text-neutral-500 hover:text-[#E50914] px-2\"><Trash2 className=\"w-4 h-4\" /></button>
          </div>
        ))}
        <button type=\"button\" onClick={() => setF({ ...f, sources: [...f.sources, { label: `Servidor ${f.sources.length + 1}`, url: \"\" }] })} className=\"text-xs uppercase tracking-widest font-bold text-[#FFB800] hover:text-white\">+ Adicionar servidor</button>
      </div>

      <div className=\"flex gap-4\">
        <label className=\"flex items-center gap-2 text-sm cursor-pointer\">
          <input type=\"checkbox\" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} className=\"accent-[#E50914]\" /> Destaque
        </label>
        <label className=\"flex items-center gap-2 text-sm cursor-pointer\">
          <input type=\"checkbox\" checked={f.trending} onChange={(e) => setF({ ...f, trending: e.target.checked })} className=\"accent-[#E50914]\" /> Trending
        </label>
      </div>

      <div className=\"flex gap-3 pt-2\">
        <button data-testid=\"mf-submit\" disabled={busy} className=\"bg-[#E50914] hover:bg-[#B80710] disabled:opacity-50 font-bold text-sm px-5 py-2.5 rounded-full transition-colors\">
          {busy ? \"Salvando...\" : \"Salvar filme\"}
        </button>
        <button type=\"button\" onClick={onCancel} className=\"text-sm text-neutral-500 hover:text-white\">Cancelar</button>
      </div>
    </form>
  );
}

export default function Admin() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState({ movies: 0, comments: 0, pending_comments: 0, total_views: 0 });
  const [movies, setMovies] = useState([]);
  const [comments, setComments] = useState([]);
  const [tab, setTab] = useState(\"movies\");
  const [editing, setEditing] = useState(null); // null=none, {}=new, {...}=edit
  const [q, setQ] = useState(\"\");

  const load = async () => {
    const [s, m, c] = await Promise.all([
      api.get(\"/admin/stats\"),
      api.get(\"/movies\", { params: { limit: 200 } }),
      api.get(\"/admin/comments\"),
    ]);
    setStats(s.data);
    setMovies(m.data.items);
    setComments(c.data.items);
  };

  useEffect(() => {
    if (user === false) { nav(\"/admin/login\"); return; }
    if (user) load();
  }, [user]);

  const remove = async (id) => {
    if (!window.confirm(\"Confirmar exclusão do filme?\")) return;
    try { await api.delete(`/movies/${id}`); toast.success(\"Removido\"); load(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };

  const toggleApproved = async (c) => {
    try { await api.patch(`/admin/comments/${c.id}`, null, { params: { approved: !c.approved } }); load(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };

  const deleteComment = async (id) => {
    if (!window.confirm(\"Excluir comentário?\")) return;
    try { await api.delete(`/admin/comments/${id}`); load(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };

  const filtered = movies.filter((m) => !q || m.title.toLowerCase().includes(q.toLowerCase()));

  if (user === null) return <div className=\"pt-32 text-center text-neutral-500\">Carregando...</div>;
  if (!user) return null;

  return (
    <div data-testid=\"admin-page\" className=\"pt-24 pb-16 max-w-7xl mx-auto px-6\">
      <div className=\"flex items-center justify-between mb-8\">
        <div>
          <div className=\"text-xs uppercase tracking-[0.3em] text-neutral-500 font-bold\">Painel</div>
          <h1 className=\"font-display text-4xl md:text-5xl font-black tracking-tighter uppercase\">Admin</h1>
        </div>
        <button data-testid=\"logout-btn\" onClick={() => { logout(); nav(\"/\"); }} className=\"inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-sm\">
          <LogOut className=\"w-4 h-4\" /> Sair
        </button>
      </div>

      {/* Stats bento */}
      <div className=\"grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8\">
        {[
          { icon: FilmIcon, label: \"Filmes\", value: stats.movies, color: \"#E50914\" },
          { icon: MessageSquare, label: \"Comentários\", value: stats.comments, color: \"#FFB800\" },
          { icon: Eye, label: \"Visualizações\", value: stats.total_views, color: \"#3B82F6\" },
          { icon: TrendingUp, label: \"Pendentes\", value: stats.pending_comments, color: \"#10B981\" },
        ].map((s) => (
          <div key={s.label} className=\"bg-[#111] border border-white/5 rounded-xl p-5 relative overflow-hidden\">
            <s.icon className=\"w-5 h-5 mb-3\" style={{ color: s.color }} />
            <div className=\"text-3xl font-display font-black tracking-tighter\">{s.value}</div>
            <div className=\"text-xs uppercase tracking-widest text-neutral-500 font-bold mt-1\">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className=\"flex gap-6 border-b border-white/5 mb-6\">
        {[
          { k: \"movies\", l: \"Filmes\" },
          { k: \"comments\", l: `Comentários (${comments.length})` },
          { k: \"ads\", l: \"Anúncios\" },
        ].map((t) => (
          <button
            key={t.k}
            data-testid={`tab-${t.k}`}
            onClick={() => setTab(t.k)}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px ${
              tab === t.k ? \"border-[#E50914] text-white\" : \"border-transparent text-neutral-500 hover:text-white\"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === \"movies\" && (
        <>
          {editing !== null ? (
            <MovieForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
          ) : (
            <>
              <div className=\"flex items-center justify-between mb-4 gap-3 flex-wrap\">
                <input data-testid=\"admin-movie-search\" placeholder=\"Buscar filme...\" value={q} onChange={(e) => setQ(e.target.value)} className=\"bg-[#111] border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-[#E50914] flex-1 max-w-sm\" />
                <button data-testid=\"new-movie-btn\" onClick={() => setEditing({})} className=\"inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#B80710] font-bold text-sm px-5 py-2.5 rounded-full transition-colors\">
                  <Plus className=\"w-4 h-4\" /> Novo filme
                </button>
              </div>
              <div className=\"bg-[#111] border border-white/5 rounded-xl overflow-hidden\">
                <table className=\"w-full text-sm\">
                  <thead className=\"bg-white/5 text-xs uppercase tracking-widest text-neutral-500\">
                    <tr>
                      <th className=\"text-left p-4\">Filme</th>
                      <th className=\"text-left p-4 hidden md:table-cell\">Ano</th>
                      <th className=\"text-left p-4 hidden md:table-cell\">Nota</th>
                      <th className=\"text-left p-4 hidden lg:table-cell\">Views</th>
                      <th className=\"p-4\"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.id} data-testid={`admin-movie-row-${m.id}`} className=\"border-t border-white/5 hover:bg-white/[0.02]\">
                        <td className=\"p-4\">
                          <div className=\"flex items-center gap-3\">
                            <img src={posterUrl(m)} alt=\"\" className=\"w-10 h-14 rounded object-cover\" />
                            <div>
                              <div className=\"font-semibold\">{m.title}</div>
                              <div className=\"text-xs text-neutral-500\">{m.genres?.join(\", \")}</div>
                            </div>
                          </div>
                        </td>
                        <td className=\"p-4 hidden md:table-cell\">{m.year}</td>
                        <td className=\"p-4 hidden md:table-cell text-[#FFB800] font-bold\">{m.rating?.toFixed(1)}</td>
                        <td className=\"p-4 hidden lg:table-cell text-neutral-400\">{m.views}</td>
                        <td className=\"p-4 text-right\">
                          <div className=\"inline-flex gap-1\">
                            <button onClick={() => setEditing(m)} data-testid={`edit-${m.id}`} className=\"p-2 text-neutral-500 hover:text-white\"><Edit className=\"w-4 h-4\" /></button>
                            <button onClick={() => remove(m.id)} data-testid={`delete-${m.id}`} className=\"p-2 text-neutral-500 hover:text-[#E50914]\"><Trash2 className=\"w-4 h-4\" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {tab === \"comments\" && (
        <div className=\"space-y-3\" data-testid=\"admin-comments\">
          {comments.length === 0 ? (
            <div className=\"text-sm text-neutral-500 py-12 text-center\">Nenhum comentário ainda.</div>
          ) : comments.map((c) => (
            <div key={c.id} className=\"bg-[#111] border border-white/5 rounded-xl p-4 flex items-start gap-4\">
              <div className=\"flex-1\">
                <div className=\"flex items-center gap-2 mb-1\">
                  <span className=\"font-semibold text-sm\">{c.name}</span>
                  <span className=\"text-xs text-neutral-500\">{c.email}</span>
                  <span className=\"text-xs text-[#FFB800]\">★ {c.rating}</span>
                  {!c.approved && <span className=\"text-[10px] uppercase tracking-widest text-[#E50914] bg-[#E50914]/10 border border-[#E50914]/30 px-2 py-0.5 rounded-full\">Oculto</span>}
                </div>
                <p className=\"text-sm text-neutral-300\">{c.text}</p>
                <div className=\"text-xs text-neutral-500 mt-1\">{new Date(c.created_at).toLocaleString(\"pt-BR\")}</div>
              </div>
              <div className=\"flex flex-col gap-1\">
                <button onClick={() => toggleApproved(c)} data-testid={`toggle-${c.id}`} className=\"p-2 text-neutral-500 hover:text-[#10B981]\" title={c.approved ? \"Ocultar\" : \"Aprovar\"}>
                  {c.approved ? <X className=\"w-4 h-4\" /> : <Check className=\"w-4 h-4\" />}
                </button>
                <button onClick={() => deleteComment(c.id)} data-testid={`del-comment-${c.id}`} className=\"p-2 text-neutral-500 hover:text-[#E50914]\">
                  <Trash2 className=\"w-4 h-4\" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === \"ads\" && <AdSection />}
    </div>
  );
}
