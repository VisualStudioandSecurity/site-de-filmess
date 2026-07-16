"import React, { useEffect, useState } from \"react\";
import { useParams, Link } from \"react-router-dom\";
import { api, backdropUrl, posterUrl, formatErr } from \"@/lib/api\";
import { Star, Clock, Calendar, Play, MessageSquare } from \"lucide-react\";
import AdSlot from \"@/components/site/AdSlot\";
import { toast } from \"sonner\";

function CommentForm({ movieId, onNew }) {
  const [form, setForm] = useState({ name: \"\", email: \"\", rating: 5, text: \"\" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/movies/${movieId}/comments`, form);
      onNew(data);
      setForm({ name: \"\", email: \"\", rating: 5, text: \"\" });
      toast.success(\"Comentário enviado!\");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail) || \"Erro ao enviar\");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} data-testid=\"comment-form\" className=\"bg-[#111] border border-white/5 rounded-xl p-6 space-y-4\">
      <div className=\"grid md:grid-cols-2 gap-3\">
        <input data-testid=\"comment-name\" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder=\"Seu nome\" className=\"bg-[#050505] border border-white/10 rounded-md px-4 py-3 text-sm outline-none focus:border-[#E50914]\" />
        <input data-testid=\"comment-email\" required type=\"email\" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder=\"Seu email\" className=\"bg-[#050505] border border-white/10 rounded-md px-4 py-3 text-sm outline-none focus:border-[#E50914]\" />
      </div>
      <div className=\"flex items-center gap-2\">
        <span className=\"text-xs uppercase tracking-widest text-neutral-500 font-bold\">Nota:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type=\"button\"
            key={n}
            data-testid={`rating-${n}`}
            onClick={() => setForm({ ...form, rating: n })}
            className={`p-1 transition-colors ${n <= form.rating ? \"text-[#FFB800]\" : \"text-neutral-700 hover:text-neutral-500\"}`}
          >
            <Star className={`w-5 h-5 ${n <= form.rating ? \"fill-current\" : \"\"}`} />
          </button>
        ))}
      </div>
      <textarea data-testid=\"comment-text\" required value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4} placeholder=\"Compartilhe sua opinião sobre o filme...\" className=\"w-full bg-[#050505] border border-white/10 rounded-md px-4 py-3 text-sm outline-none focus:border-[#E50914] resize-none\" />
      <button data-testid=\"comment-submit\" disabled={busy} className=\"inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#B80710] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-full transition-colors\">
        <MessageSquare className=\"w-4 h-4\" /> {busy ? \"Enviando...\" : \"Enviar comentário\"}
      </button>
    </form>
  );
}

export default function MovieDetails() {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);
  const [comments, setComments] = useState([]);
  const [activeSource, setActiveSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    (async () => {
      setPlaying(false);
      const { data } = await api.get(`/movies/${slug}`);
      setMovie(data);
      setActiveSource(data.sources?.[0] || null);
      document.title = `${data.title} (${data.year}) — MovieHub`;

      const { data: cdata } = await api.get(`/movies/${data.id}/comments`);
      setComments(cdata.items);

      if (data.genres?.[0]) {
        const { data: sug } = await api.get(\"/movies\", { params: { genre: data.genres[0], limit: 10 } });
        setSuggestions(sug.items.filter((s) => s.id !== data.id).slice(0, 6));
      }
    })();
  }, [slug]);

  if (!movie) return <div className=\"pt-32 text-center text-neutral-500\">Carregando...</div>;

  return (
    <div data-testid=\"movie-details-page\">
      {/* Backdrop */}
      <div className=\"relative w-full h-[55vh] md:h-[70vh]\">
        <img src={backdropUrl(movie)} alt=\"\" className=\"absolute inset-0 w-full h-full object-cover\" />
        <div className=\"absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-[#050505]/40\" />
      </div>

      <div className=\"max-w-7xl mx-auto px-6 -mt-40 md:-mt-64 relative z-10\">
        <div className=\"grid md:grid-cols-[240px_1fr] gap-8\">
          <div className=\"w-[180px] md:w-[240px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10\">
            <img src={posterUrl(movie)} alt={movie.title} className=\"w-full h-full object-cover\" />
          </div>
          <div>
            <div className=\"flex items-center gap-2 mb-3 flex-wrap\">
              {movie.genres?.map((g) => (
                <span key={g} className=\"text-[10px] uppercase tracking-[0.2em] font-bold text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/30 px-3 py-1 rounded-full\">{g}</span>
              ))}
            </div>
            <h1 data-testid=\"movie-title\" className=\"font-display text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-4\">
              {movie.title}
            </h1>
            <div className=\"flex flex-wrap items-center gap-4 text-sm text-neutral-300 mb-6\">
              <span className=\"flex items-center gap-1\"><Star className=\"w-4 h-4 text-[#FFB800] fill-[#FFB800]\" /><b className=\"text-white text-base\">{movie.rating?.toFixed(1)}</b></span>
              <span className=\"flex items-center gap-1\"><Calendar className=\"w-3.5 h-3.5\" />{movie.year}</span>
              <span className=\"flex items-center gap-1\"><Clock className=\"w-3.5 h-3.5\" />{movie.duration_min} min</span>
              <span>{movie.language}</span>
              <span className=\"text-neutral-500\">{movie.views} visualizações</span>
            </div>
            <p className=\"text-neutral-300 text-base leading-relaxed max-w-3xl mb-6\">{movie.synopsis}</p>

            <AdSlot slot=\"pre_player\" variant=\"billboard\" />

            {/* Player */}
            <div className=\"mt-6\">
              <div className=\"text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2\">Player</div>
              <div data-testid=\"player-container\" className=\"w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative flex items-center justify-center\">
                {playing && activeSource ? (
                  <iframe
                    data-testid=\"player-iframe\"
                    src={activeSource.url}
                    title={movie.title}
                    allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\"
                    allowFullScreen
                    className=\"w-full h-full\"
                  />
                ) : (
                  <>
                    <img src={backdropUrl(movie)} alt=\"\" className=\"absolute inset-0 w-full h-full object-cover opacity-40\" />
                    <button
                      data-testid=\"play-btn\"
                      onClick={() => setPlaying(true)}
                      className=\"relative w-20 h-20 rounded-full bg-[#E50914] hover:bg-[#B80710] flex items-center justify-center shadow-[0_0_40px_rgba(229,9,20,0.6)] transition-all hover:scale-110\"
                    >
                      <Play className=\"w-8 h-8 fill-white text-white ml-1\" />
                    </button>
                  </>
                )}
              </div>

              {movie.sources?.length > 0 && (
                <div className=\"mt-3 flex flex-wrap gap-2\">
                  {movie.sources.map((s, i) => (
                    <button
                      key={i}
                      data-testid={`source-btn-${i}`}
                      onClick={() => { setActiveSource(s); setPlaying(true); }}
                      className={`text-xs font-bold px-4 py-2 rounded-full border transition-colors ${
                        activeSource?.url === s.url
                          ? \"bg-[#E50914] border-[#E50914] text-white\"
                          : \"bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300\"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <section className=\"mt-16\">
          <div className=\"text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 mb-2\">Interação</div>
          <h2 className=\"font-display text-2xl md:text-3xl font-bold tracking-tight mb-6\">Comentários & Avaliações</h2>
          <div className=\"grid lg:grid-cols-[1fr_320px] gap-8\">
            <div>
              <CommentForm movieId={movie.id} onNew={(c) => setComments([c, ...comments])} />
              <div className=\"mt-6 space-y-4\" data-testid=\"comments-list\">
                {comments.length === 0 && (
                  <div className=\"text-sm text-neutral-500 py-8 text-center\">Seja o primeiro a comentar.</div>
                )}
                {comments.map((c) => (
                  <div key={c.id} className=\"bg-[#111] border border-white/5 rounded-xl p-5\">
                    <div className=\"flex items-center justify-between mb-2\">
                      <div className=\"flex items-center gap-2\">
                        <div className=\"w-8 h-8 rounded-full bg-gradient-to-br from-[#E50914] to-[#FFB800] flex items-center justify-center text-xs font-black\">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className=\"text-sm font-semibold\">{c.name}</div>
                          <div className=\"text-xs text-neutral-500\">{new Date(c.created_at).toLocaleDateString(\"pt-BR\")}</div>
                        </div>
                      </div>
                      <div className=\"flex items-center gap-0.5\">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= c.rating ? \"text-[#FFB800] fill-[#FFB800]\" : \"text-neutral-700\"}`} />
                        ))}
                      </div>
                    </div>
                    <p className=\"text-sm text-neutral-300 leading-relaxed\">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <aside className=\"space-y-4\">
              <AdSlot slot=\"sidebar\" variant=\"sidebar\" />
            </aside>
          </div>
        </section>

        {suggestions.length > 0 && (
          <section className=\"mt-16 mb-24\">
            <h2 className=\"font-display text-2xl md:text-3xl font-bold tracking-tight mb-6\">Você também pode gostar</h2>
            <div className=\"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4\">
              {suggestions.map((s) => (
                <Link to={`/filme/${s.slug}`} key={s.id} data-testid={`suggestion-${s.slug}`} className=\"group\">
                  <div className=\"aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 group-hover:scale-105 transition-transform duration-300\">
                    <img src={posterUrl(s)} alt={s.title} className=\"w-full h-full object-cover\" />
                  </div>
                  <div className=\"mt-2 text-sm font-semibold line-clamp-1\">{s.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
