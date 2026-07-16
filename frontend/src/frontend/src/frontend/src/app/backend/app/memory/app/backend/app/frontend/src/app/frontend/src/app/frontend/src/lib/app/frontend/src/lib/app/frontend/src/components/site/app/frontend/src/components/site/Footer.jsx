"import React from \"react\";
import { Film } from \"lucide-react\";

export default function Footer() {
  return (
    <footer data-testid=\"site-footer\" className=\"mt-24 border-t border-white/5 bg-[#050505]\">
      <div className=\"max-w-7xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-3\">
        <div>
          <div className=\"flex items-center gap-2 mb-3\">
            <div className=\"w-8 h-8 rounded-md gradient-red flex items-center justify-center\">
              <Film className=\"w-4 h-4 text-white\" />
            </div>
            <span className=\"font-display font-black tracking-tighter uppercase\">
              Movie<span className=\"text-[#E50914]\">Hub</span>
            </span>
          </div>
          <p className=\"text-sm text-neutral-500 leading-relaxed max-w-sm\">
            Sua sala de cinema online. Descubra filmes, deixe sua avaliação e mergulhe em experiências cinematográficas.
          </p>
        </div>

        <div>
          <div className=\"text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3\">Navegar</div>
          <ul className=\"space-y-2 text-sm text-neutral-400\">
            <li><a href=\"/\" className=\"hover:text-white transition-colors\">Início</a></li>
            <li><a href=\"/catalogo\" className=\"hover:text-white transition-colors\">Catálogo completo</a></li>
            <li><a href=\"/catalogo?section=featured\" className=\"hover:text-white transition-colors\">Lançamentos</a></li>
            <li><a href=\"/catalogo?section=trending\" className=\"hover:text-white transition-colors\">Mais assistidos</a></li>
          </ul>
        </div>

        <div>
          <div className=\"text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3\">Legal</div>
          <ul className=\"space-y-2 text-sm text-neutral-400\">
            <li className=\"hover:text-white cursor-pointer\">Termos de uso</li>
            <li className=\"hover:text-white cursor-pointer\">Política de privacidade</li>
            <li className=\"hover:text-white cursor-pointer\">DMCA</li>
          </ul>
        </div>
      </div>
      <div className=\"border-t border-white/5 py-6 text-center text-xs text-neutral-600\">
        © {new Date().getFullYear()} MovieHub. Todos os direitos reservados.
      </div>
    </footer>
  );
}
"
