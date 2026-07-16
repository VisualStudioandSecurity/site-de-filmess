"import React, { useRef } from \"react\";
import { ChevronLeft, ChevronRight } from \"lucide-react\";
import MovieCard from \"./MovieCard\";

export default function Carousel({ title, movies, testId }) {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 600, behavior: \"smooth\" });
  };
  if (!movies || movies.length === 0) return null;

  return (
    <section data-testid={testId} className=\"my-12 md:my-16\">
      <div className=\"max-w-7xl mx-auto px-6 flex items-center justify-between mb-4\">
        <h2 className=\"font-display text-2xl sm:text-3xl font-bold tracking-tight\">{title}</h2>
        <div className=\"flex gap-2\">
          <button onClick={() => scroll(-1)} className=\"w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors\" data-testid={`${testId}-prev`}>
            <ChevronLeft className=\"w-4 h-4\" />
          </button>
          <button onClick={() => scroll(1)} className=\"w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors\" data-testid={`${testId}-next`}>
            <ChevronRight className=\"w-4 h-4\" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className=\"hide-scrollbar overflow-x-auto scroll-smooth\">
        <div className=\"flex gap-4 md:gap-5 px-6 max-w-[calc(100vw)] pb-2\">
          {movies.map((m) => (
            <div key={m.id} className=\"w-[150px] md:w-[180px] shrink-0\">
              <MovieCard movie={m} />
            </div>
          ))}
        </div>
      </div>
    </section>
