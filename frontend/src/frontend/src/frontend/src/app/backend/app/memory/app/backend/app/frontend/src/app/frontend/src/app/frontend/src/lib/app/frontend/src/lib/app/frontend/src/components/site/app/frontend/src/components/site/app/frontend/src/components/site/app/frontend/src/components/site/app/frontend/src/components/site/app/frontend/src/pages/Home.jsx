"import React, { useEffect, useState } from \"react\";
import { Link } from \"react-router-dom\";
import { Star, Play, Info, Clock } from \"lucide-react\";
import { api, backdropUrl } from \"@/lib/api\";
import Carousel from \"@/components/site/Carousel\";
import AdSlot from \"@/components/site/AdSlot\";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [byGenre, setByGenre] = useState({});
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const [f, t, l, g] = await Promise.all([
        api.get(\"/movies\", { params: { section: \"featured\", limit: 8 } }),
        api.get(\"/movies\", { params: { section: \"trending\", limit: 12 } }),
        api.get(\"/movies\", { params: { limit: 12 } }),
        api.get(\"/movies/genres\"),
      ]);
      setFeatured(f.data.items);
      setTrending(t.data.items);
      setLatest(l.data.items);
      const genreMap = {};
      const genres = (g.data.genres || []).slice(0, 4);
      await Promise.all(
        genres.map(async (gn) => {
          const { data } = await api.get(\"/movies\", { params: { genre: gn, limit: 10 } });
          if (data.items.length) genreMap[gn] = data.items;
        })
      );
      setByGenre(genreMap);
    })();
  }, []);

  useEffect(() => {
    if (featured.length < 2) return;
    const int = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 7000);
    return () => clearInterval(int);
  }, [featured]);

  const hero = featured[heroIdx];

  return (
    <div data-testid=\"home-page\">
      {/* Hero */}
      <section className=\"relative w-full h-[80vh] md:h-[92vh] flex items-end overflow-hidden\">
        {hero && (
          <>
            <img
              key={hero.id}
              src={backdropUrl(hero)}
              alt={hero.title}
              className=\"absolute inset-0 w-full h-full object-cover fade-up\"
            />
            <div className=\"absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent\" />
            <div className=\"absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/30 to-transparent\" />
          </>
        )}
        <div className=\"relative z-10 max-w-7xl mx-auto px-6 pb-16 md:pb-24 w-full\">
          {hero && (
            <div className=\"max-w-2xl fade-up\">
              <div className=\"flex items-center gap-2 mb-4\">
                <span className=\"text-xs font-bold uppercase tracking-[0.3em] text-[#FFB800]\">Destaque</span>
                <span className=\"w-1 h-1 rounded-full bg-neutral-600\" />
                <span className=\"text-xs uppercase tracking-widest text-neutral-400\">{hero.genres?.[0]}</span>
              </div>
              <h1 data-testid=\"hero-title\" className=\"font-display text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-4\">
                {hero.title}
              </h1>
              <div className=\"flex flex-wrap items-center gap-3 text-sm text-neutral-300 mb-4\">
                <span className=\"flex items-center gap-1\"><Star className=\"w-4 h-4 text-[#FFB800] fill-[#FFB800]\" /><b className=\"text-white\">{hero.rating?.toFixed(1)}</b></span>
                <span>•</span>
                <span>{hero.year}</span>
                <span>•</span>
                <span className=\"flex items-center gap-1\"><Clock className=\"w-3.5 h-3.5\" />{hero.duration_min}min</span>
                <span>•</span>
                <span>{hero.language}</span>
              </div>
              <p className=\"text-base md:text-lg text-neutral-300 leading-relaxed mb-6 line-clamp-3\">{hero.synopsis}</p>
              <div className=\"flex flex-wrap gap-3\">
                <Link
                  to={`/filme/${hero.slug}`}
                  data-testid=\"hero-play-btn\"
                  className=\"inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#B80710] text-white font-bold px-6 py-3 rounded-full shadow-[0_0_25px_rgba(229,9,20,0.4)] transition-colors\"
                >
                  <Play className=\"w-4 h-4 fill-current\" /> Assistir agora
                </Link>
                <Link
                  to={`/filme/${hero.slug}`}
                  data-testid=\"hero-info-btn\"
                  className=\"inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-medium px-6 py-3 rounded-full transition-colors\"
                >
                  <Info className=\"w-4 h-4\" /> Mais informações
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Hero indicators */}
        {featured.length > 1 && (
          <div className=\"absolute bottom-6 right-6 z-20 flex gap-1.5\">
            {featured.map((_, i) => (
              <button
                key={i}
                data-testid={`hero-indicator-${i}`}
                onClick={() => setHeroIdx(i)}
                className={`h-1 rounded-full transition-all ${i === heroIdx ? \"w-8 bg-[#E50914]\" : \"w-4 bg-white/30\"}`}
              />
            ))}
          </div>
        )}
      </section>

      <div className=\"max-w-7xl mx-auto px-6\"><AdSlot slot=\"header\" variant=\"leaderboard\" /></div>

      <Carousel testId=\"carousel-trending\" title=\"🔥 Mais Assistidos\" movies={trending} />
      <Carousel testId=\"carousel-latest\" title=\"Lançamentos\" movies={latest} />

      <div className=\"max-w-7xl mx-auto px-6\"><AdSlot slot=\"in_content\" variant=\"billboard\" /></div>

      {Object.entries(byGenre).map(([g, list]) => (
        <Carousel key={g} testId={`carousel-genre-${g}`} title={g} movies={list} />
