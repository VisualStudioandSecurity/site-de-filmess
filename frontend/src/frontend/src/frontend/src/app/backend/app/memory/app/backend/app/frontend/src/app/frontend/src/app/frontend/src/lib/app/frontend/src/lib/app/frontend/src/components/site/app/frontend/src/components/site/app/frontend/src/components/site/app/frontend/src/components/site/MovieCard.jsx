"import React from \"react\";
import { Link } from \"react-router-dom\";
import { Star, Play } from \"lucide-react\";
import { posterUrl } from \"@/lib/api\";

export default function MovieCard({ movie, size = \"md\" }) {
  const widthClass = size === \"sm\" ? \"w-[140px] md:w-[160px]\" : \"w-full\";
  return (
    <Link
      to={`/filme/${movie.slug}`}
      data-testid={`movie-card-${movie.slug}`}
      className={`group relative block ${widthClass} shrink-0`}
    >
      <div className=\"aspect-[2/3] rounded-lg overflow-hidden relative bg-neutral-900 ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-[1.04] group-hover:ring-white/20 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)]\">
        {movie.poster_url ? (
          <img
            src={posterUrl(movie)}
            alt={movie.title}
            loading=\"lazy\"
            className=\"w-full h-full object-cover\"
          />
        ) : (
          <div className=\"w-full h-full flex items-center justify-center text-neutral-700 text-xs\">Sem poster</div>
        )}
        <div className=\"absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3\">
          <div className=\"flex items-center gap-1.5 mb-1.5\">
            <Star className=\"w-3.5 h-3.5 text-[#FFB800] fill-[#FFB800]\" />
            <span className=\"text-sm font-bold\">{movie.rating?.toFixed(1)}</span>
            <span className=\"text-xs text-neutral-400\">• {movie.year}</span>
          </div>
          <p className=\"text-xs text-neutral-300 line-clamp-2 leading-snug\">{movie.synopsis}</p>
          <div className=\"mt-2 inline-flex items-center gap-1 text-xs font-bold text-white\">
            <Play className=\"w-3 h-3 fill-current\" /> Assistir
          </div>
        </div>
      </div>
      <div className=\"mt-2 px-0.5\">
        <h3 className=\"text-sm font-semibold tracking-tight leading-tight line-clamp-1\">{movie.title}</h3>
        <p className=\"text-xs text-neutral-500 mt-0.5\">{movie.year} • {movie.genres?.[0]}</p>
      </div>
    </Link>
  );
}
