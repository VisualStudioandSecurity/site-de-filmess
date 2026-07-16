"import React, { useEffect, useState } from \"react\";
import { useSearchParams } from \"react-router-dom\";
import { api } from \"@/lib/api\";
import MovieCard from \"@/components/site/MovieCard\";
import AdSlot from \"@/components/site/AdSlot\";
import { Search, SlidersHorizontal } from \"lucide-react\";

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get(\"q\") || \"\");

  const genre = params.get(\"genre\") || \"\";
  const year = params.get(\"year\") || \"\";
  const min_rating = params.get(\"min_rating\") || \"\";
  const language = params.get(\"language\") || \"\";
  const section = params.get(\"section\") || \"\";

  useEffect(() => {
    api.get(\"/movies/genres\").then(({ data }) => setGenres(data.genres || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (params.get(\"q\")) query.q = params.get(\"q\");
    if (genre) query.genre = genre;
    if (year) query.year = Number(year);
    if (min_rating) query.min_rating = Number(min_rating);
    if (language) query.language = language;
    if (section) query.section = section;
    query.limit = 60;
    api.get(\"/movies\", { params: query }).then(({ data }) => {
      setMovies(data.items);
      setLoading(false);
    });
  }, [params]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next);
  };

  const onSearch = (e) => {
    e.preventDefault();
    setParam(\"q\", q.trim());
  };

  return (
    <div data-testid=\"catalog-page\" className=\"pt-24 pb-16 max-w-7xl mx-auto px-6\">
      <div className=\"mb-6\">
        <div className=\"text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 mb-2\">Catálogo</div>
        <h1 className=\"font-display text-4xl md:text-5xl font-black tracking-tighter uppercase\">
          {section === \"featured\" ? \"Lançamentos\" : section === \"trending\" ? \"Mais Assistidos\" : \"Todos os Filmes\"}
        </h1>
      </div>

      <form onSubmit={onSearch} className=\"mb-6 flex items-center bg-white/5 border border-white/10 rounded-full px-5 py-3 focus-within:border-[#E50914]\">
        <Search className=\"w-4 h-4 text-neutral-500 mr-3\" />
        <input
          data-testid=\"catalog-search\"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder=\"Buscar por título...\"
          className=\"bg-transparent flex-1 outline-none text-sm placeholder:text-neutral-500\"
        />
        <button data-testid=\"catalog-search-submit\" type=\"submit\" className=\"text-xs uppercase tracking-widest font-bold text-[#FFB800] hover:text-white transition-colors\">Buscar</button>
      </form>

      <div className=\"flex flex-wrap items-center gap-3 mb-8 text-sm\">
        <div className=\"flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 font-bold\">
          <SlidersHorizontal className=\"w-3.5 h-3.5\" /> Filtros
        </div>
        <select data-testid=\"filter-genre\" value={genre} onChange={(e) => setParam(\"genre\", e.target.value)} className=\"bg-[#111] border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-[#E50914]\">
          <option value=\"\">Todos os gêneros</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select data-testid=\"filter-year\" value={year} onChange={(e) => setParam(\"year\", e.target.value)} className=\"bg-[#111] border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-[#E50914]\">
          <option value=\"\">Ano</option>
          {[2024, 2023, 2022, 2021, 2020, 2019].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select data-testid=\"filter-rating\" value={min_rating} onChange={(e) => setParam(\"min_rating\", e.target.value)} className=\"bg-[#111] border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-[#E50914]\">
          <option value=\"\">Nota mínima</option>
          <option value=\"7\">7+</option>
          <option value=\"8\">8+</option>
          <option value=\"9\">9+</option>
        </select>
        <select data-testid=\"filter-language\" value={language} onChange={(e) => setParam(\"language\", e.target.value)} className=\"bg-[#111] border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-[#E50914]\">
          <option value=\"\">Idioma</option>
          <option value=\"Português\">Português</option>
          <option value=\"Inglês\">Inglês</option>
        </select>
        {(genre || year || min_rating || language || params.get(\"q\") || section) && (
          <button
            data-testid=\"clear-filters\"
            onClick={() => setParams(new URLSearchParams())}
            className=\"text-xs uppercase tracking-widest text-[#E50914] hover:underline font-bold\"
          >
            Limpar
          </button>
        )}
      </div>

      <AdSlot slot=\"header\" variant=\"leaderboard\" />

      {loading ? (
        <div className=\"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mt-6\">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className=\"aspect-[2/3] rounded-lg shimmer\" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div data-testid=\"empty-state\" className=\"py-24 text-center text-neutral-500\">
          <p className=\"text-lg\">Nenhum filme encontrado com esses filtros.</p>
        </div>
      ) : (
        <div data-testid=\"movies-grid\" className=\"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mt-6\">
          {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
