"# ocinemagratis — PRD

## Original Problem Statement
Site próprio de filmes com catálogo, player, avaliações e painel admin, otimizado para monetização com anúncios. React + FastAPI + MongoDB. Tema dark cinema, pt-BR.

## Architecture
- **Frontend**: React 19 + TailwindCSS + shadcn/ui + Sonner (toasts) + react-router-dom.
- **Backend**: FastAPI + Motor (async MongoDB) + PyJWT + bcrypt + Emergent Object Storage for poster uploads.
- **Auth**: JWT (Bearer + httpOnly cookie fallback), single admin seeded on startup.
- **DB collections**: movies, comments, admins, ads_config, files.

## User Personas
- **Visitante**: Descobre e assiste filmes, avalia/comenta.
- **Admin**: Gerencia catálogo, comentários, slots de anúncio.

## Core Requirements (Static)
- Home com hero rotativo, carrosséis de trending, lançamentos, gêneros.
- Catálogo com busca + filtros (gênero, ano, nota, idioma).
- Página de filme com player iframe multi-servidor + comentários.
- Painel admin CRUD de filmes + moderação comentários + config anúncios.
- Slots de anúncio configuráveis (HTML injetável) em 4 posições.
- SEO: title dinâmico por filme, URLs limpas com slug, meta descrição via sinopse.

## Implemented (2026-02-16)
- ✅ Backend API completa (auth, movies CRUD, comments, ads, stats, upload).
- ✅ Seed automático: admin@moviehub.com/Admin@123 + 12 filmes com posters/backdrops.
- ✅ Home com hero rotativo, 3+ carrosséis, anúncios placeholder.
- ✅ Catálogo com grid Netflix-style + filtros dinâmicos + busca.
- ✅ Detalhe do filme com player iframe (múltiplos servidores) + formulário de comentários + rating por estrelas.
- ✅ Admin dashboard (stats bento, tabs Filmes/Comentários/Anúncios), CRUD completo + upload de poster via object storage.
- ✅ Design luxury cinematic dark-only (Outfit + Manrope), palette #050505/#E50914/#FFB800.
- ✅ Testing agent E2E — 100% pass (backend + frontend).

## Prioritized Backlog (deferred)
### P1
- Integração TMDB (importação automática de dados de filmes por título/id).
- Lista \"assistir depois\" com localStorage.
- Sitemap.xml + meta OpenGraph.

### P2
- Categoria de séries e episódios.
- Sistema de tags + recomendações IA.
- Múltiplos admins com permissões.
- Newsletter (Resend).
- Pop-under ad option com frequência controlada.

## Credentials
- Admin: `admin@moviehub.com` / `Admin@123`
"
