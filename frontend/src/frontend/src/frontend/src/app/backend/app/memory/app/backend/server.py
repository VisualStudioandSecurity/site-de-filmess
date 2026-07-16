"from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / \".env\")

import os
import uuid
import logging
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# -------- Config --------
MONGO_URL = os.environ[\"MONGO_URL\"]
DB_NAME = os.environ[\"DB_NAME\"]
JWT_SECRET = os.environ[\"JWT_SECRET\"]
ADMIN_EMAIL = os.environ.get(\"ADMIN_EMAIL\", \"admin@moviehub.com\")
ADMIN_PASSWORD = os.environ.get(\"ADMIN_PASSWORD\", \"Admin@123\")
EMERGENT_LLM_KEY = os.environ.get(\"EMERGENT_LLM_KEY\", \"\")
APP_NAME = os.environ.get(\"APP_NAME\", \"moviehub\")
STORAGE_URL = \"https://integrations.emergentagent.com/objstore/api/v1/storage\"
JWT_ALGO = \"HS256\"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title=\"MovieHub API\")
api = APIRouter(prefix=\"/api\")

logger = logging.getLogger(\"moviehub\")
logging.basicConfig(level=logging.INFO)


# -------- Auth helpers --------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(\"utf-8\"), bcrypt.gensalt()).decode(\"utf-8\")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(\"utf-8\"), hashed.encode(\"utf-8\"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        \"sub\": user_id,
        \"email\": email,
        \"exp\": datetime.now(timezone.utc) + timedelta(hours=8),
        \"type\": \"access\",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get(\"access_token\")
    if not token:
        auth = request.headers.get(\"Authorization\", \"\")
        if auth.startswith(\"Bearer \"):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail=\"Não autenticado\")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail=\"Token expirado\")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail=\"Token inválido\")
    user = await db.admins.find_one({\"id\": payload[\"sub\"]}, {\"_id\": 0})
    if not user:
        raise HTTPException(status_code=401, detail=\"Usuário não encontrado\")
    user.pop(\"password_hash\", None)
    return user


# -------- Storage helpers --------
_storage_key: Optional[str] = None


def init_storage() -> Optional[str]:
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_LLM_KEY:
        return None
    try:
        r = requests.post(f\"{STORAGE_URL}/init\", json={\"emergent_key\": EMERGENT_LLM_KEY}, timeout=30)
        r.raise_for_status()
        _storage_key = r.json()[\"storage_key\"]
        return _storage_key
    except Exception as e:
        logger.error(f\"Storage init failed: {e}\")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail=\"Storage indisponível\")
    r = requests.put(
        f\"{STORAGE_URL}/objects/{path}\",
        headers={\"X-Storage-Key\": key, \"Content-Type\": content_type},
        data=data,
        timeout=120,
    )
    r.raise_for_status()
    return r.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail=\"Storage indisponível\")
    r = requests.get(f\"{STORAGE_URL}/objects/{path}\", headers={\"X-Storage-Key\": key}, timeout=60)
    r.raise_for_status()
    return r.content, r.headers.get(\"Content-Type\", \"application/octet-stream\")


# -------- Models --------
class StreamSource(BaseModel):
    label: str
    url: str


class MovieBase(BaseModel):
    title: str
    original_title: Optional[str] = \"\"
    synopsis: str = \"\"
    year: int
    duration_min: int = 0
    genres: List[str] = []
    language: str = \"Português\"
    rating: float = 0.0
    poster_url: str = \"\"
    backdrop_url: str = \"\"
    trailer_url: Optional[str] = \"\"
    sources: List[StreamSource] = []
    featured: bool = False
    trending: bool = False


class MovieCreate(MovieBase):
    pass


class MovieUpdate(BaseModel):
    model_config = ConfigDict(extra=\"ignore\")
    title: Optional[str] = None
    original_title: Optional[str] = None
    synopsis: Optional[str] = None
    year: Optional[int] = None
    duration_min: Optional[int] = None
    genres: Optional[List[str]] = None
    language: Optional[str] = None
    rating: Optional[float] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    sources: Optional[List[StreamSource]] = None
    featured: Optional[bool] = None
    trending: Optional[bool] = None


class Movie(MovieBase):
    id: str
    slug: str
    views: int = 0
    created_at: str


class CommentCreate(BaseModel):
    name: str
    email: EmailStr
    rating: int = Field(ge=1, le=5)
    text: str


class Comment(BaseModel):
    id: str
    movie_id: str
    name: str
    email: str
    rating: int
    text: str
    approved: bool
    created_at: str


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class AdsConfig(BaseModel):
    header_html: str = \"\"
    sidebar_html: str = \"\"
    in_content_html: str = \"\"
    pre_player_html: str = \"\"


# -------- Utilities --------
def slugify(text: str) -> str:
    import re, unicodedata
    text = unicodedata.normalize(\"NFKD\", text).encode(\"ascii\", \"ignore\").decode()
    text = re.sub(r\"[^a-zA-Z0-9\s-]\", \"\", text).strip().lower()
    return re.sub(r\"[\s-]+\", \"-\", text)[:80] or str(uuid.uuid4())[:8]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# -------- Auth routes --------
@api.post(\"/auth/login\")
async def login(payload: LoginPayload, response: Response):
    email = payload.email.lower()
    user = await db.admins.find_one({\"email\": email})
    if not user or not verify_password(payload.password, user[\"password_hash\"]):
        raise HTTPException(status_code=401, detail=\"Email ou senha inválidos\")
    token = create_access_token(user[\"id\"], email)
    response.set_cookie(\"access_token\", token, httponly=True, samesite=\"lax\", max_age=28800, path=\"/\")
    return {\"access_token\": token, \"user\": {\"id\": user[\"id\"], \"email\": email, \"name\": user.get(\"name\", \"Admin\")}}


@api.post(\"/auth/logout\")
async def logout(response: Response):
    response.delete_cookie(\"access_token\", path=\"/\")
    return {\"ok\": True}


@api.get(\"/auth/me\")
async def me(user=Depends(get_current_admin)):
    return user


# -------- Movies routes --------
@api.get(\"/movies\")
async def list_movies(
    q: Optional[str] = None,
    genre: Optional[str] = None,
    year: Optional[int] = None,
    min_rating: Optional[float] = None,
    language: Optional[str] = None,
    section: Optional[str] = None,
    limit: int = 60,
    skip: int = 0,
):
    query: dict = {}
    if q:
        query[\"title\"] = {\"$regex\": q, \"$options\": \"i\"}
    if genre:
        query[\"genres\"] = genre
    if year:
        query[\"year\"] = year
    if min_rating is not None:
        query[\"rating\"] = {\"$gte\": min_rating}
    if language:
        query[\"language\"] = language
    if section == \"featured\":
        query[\"featured\"] = True
    elif section == \"trending\":
        query[\"trending\"] = True

    sort_field = \"views\" if section == \"trending\" else \"created_at\"
    cursor = db.movies.find(query, {\"_id\": 0}).sort(sort_field, -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.movies.count_documents(query)
    return {\"items\": items, \"total\": total}


@api.get(\"/movies/genres\")
async def list_genres():
    genres = await db.movies.distinct(\"genres\")
    return {\"genres\": sorted([g for g in genres if g])}


@api.get(\"/movies/{slug}\")
async def get_movie(slug: str):
    movie = await db.movies.find_one({\"slug\": slug}, {\"_id\": 0})
    if not movie:
        raise HTTPException(status_code=404, detail=\"Filme não encontrado\")
    await db.movies.update_one({\"slug\": slug}, {\"$inc\": {\"views\": 1}})
    movie[\"views\"] = movie.get(\"views\", 0) + 1
    return movie


@api.post(\"/movies\", dependencies=[Depends(get_current_admin)])
async def create_movie(payload: MovieCreate):
    slug = slugify(payload.title) + \"-\" + str(uuid.uuid4())[:6]
    doc = payload.model_dump()
    doc.update({
        \"id\": str(uuid.uuid4()),
        \"slug\": slug,
        \"views\": 0,
        \"created_at\": now_iso(),
    })
    await db.movies.insert_one(doc)
    doc.pop(\"_id\", None)
    return doc


@api.put(\"/movies/{movie_id}\", dependencies=[Depends(get_current_admin)])
async def update_movie(movie_id: str, payload: MovieUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail=\"Nada para atualizar\")
    result = await db.movies.update_one({\"id\": movie_id}, {\"$set\": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=\"Filme não encontrado\")
    updated = await db.movies.find_one({\"id\": movie_id}, {\"_id\": 0})
    return updated


@api.delete(\"/movies/{movie_id}\", dependencies=[Depends(get_current_admin)])
async def delete_movie(movie_id: str):
    result = await db.movies.delete_one({\"id\": movie_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=\"Filme não encontrado\")
    await db.comments.delete_many({\"movie_id\": movie_id})
    return {\"ok\": True}


# -------- Upload --------
@api.post(\"/upload/poster\", dependencies=[Depends(get_current_admin)])
async def upload_poster(file: UploadFile = File(...)):
    ext = (file.filename or \"img\").rsplit(\".\", 1)[-1].lower()
    if ext not in {\"jpg\", \"jpeg\", \"png\", \"webp\", \"gif\"}:
        raise HTTPException(status_code=400, detail=\"Formato não suportado\")
    file_id = str(uuid.uuid4())
    path = f\"{APP_NAME}/posters/{file_id}.{ext}\"
    data = await file.read()
    result = put_object(path, data, file.content_type or f\"image/{ext}\")
    await db.files.insert_one({
        \"id\": file_id,
        \"storage_path\": result[\"path\"],
        \"content_type\": file.content_type,
        \"created_at\": now_iso(),
    })
    backend = os.environ.get(\"PUBLIC_BACKEND_URL\", \"\")
    public_url = f\"/api/files/{file_id}\"
    return {\"id\": file_id, \"url\": public_url, \"path\": result[\"path\"]}


@api.get(\"/files/{file_id}\")
async def serve_file(file_id: str):
    rec = await db.files.find_one({\"id\": file_id}, {\"_id\": 0})
    if not rec:
        raise HTTPException(status_code=404, detail=\"Arquivo não encontrado\")
    data, ct = get_object(rec[\"storage_path\"])
    return Response(content=data, media_type=rec.get(\"content_type\") or ct)


# -------- Comments --------
@api.get(\"/movies/{movie_id}/comments\")
async def list_comments(movie_id: str, include_pending: bool = False):
    query = {\"movie_id\": movie_id}
    if not include_pending:
        query[\"approved\"] = True
    items = await db.comments.find(query, {\"_id\": 0}).sort(\"created_at\", -1).to_list(200)
    return {\"items\": items}


@api.post(\"/movies/{movie_id}/comments\")
async def create_comment(movie_id: str, payload: CommentCreate):
    movie = await db.movies.find_one({\"id\": movie_id}, {\"_id\": 0, \"id\": 1})
    if not movie:
        raise HTTPException(status_code=404, detail=\"Filme não encontrado\")
    doc = {
        \"id\": str(uuid.uuid4()),
        \"movie_id\": movie_id,
        \"name\": payload.name.strip()[:80],
        \"email\": payload.email.lower(),
        \"rating\": int(payload.rating),
        \"text\": payload.text.strip()[:2000],
        \"approved\": True,  # auto-approve; admin can hide later
        \"created_at\": now_iso(),
    }
    await db.comments.insert_one(doc)
    doc.pop(\"_id\", None)
    return doc


@api.get(\"/admin/comments\", dependencies=[Depends(get_current_admin)])
async def admin_list_comments():
    items = await db.comments.find({}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(500)
    return {\"items\": items}


@api.patch(\"/admin/comments/{comment_id}\", dependencies=[Depends(get_current_admin)])
async def admin_update_comment(comment_id: str, approved: bool):
    await db.comments.update_one({\"id\": comment_id}, {\"$set\": {\"approved\": approved}})
    return {\"ok\": True}


@api.delete(\"/admin/comments/{comment_id}\", dependencies=[Depends(get_current_admin)])
async def admin_delete_comment(comment_id: str):
    await db.comments.delete_one({\"id\": comment_id})
    return {\"ok\": True}


# -------- Ads config --------
@api.get(\"/ads/config\")
async def get_ads_config():
    cfg = await db.ads_config.find_one({\"id\": \"singleton\"}, {\"_id\": 0}) or {
        \"id\": \"singleton\",
        \"header_html\": \"\",
        \"sidebar_html\": \"\",
        \"in_content_html\": \"\",
        \"pre_player_html\": \"\",
    }
    return cfg


@api.put(\"/ads/config\", dependencies=[Depends(get_current_admin)])
async def set_ads_config(cfg: AdsConfig):
    doc = cfg.model_dump()
    doc[\"id\"] = \"singleton\"
    await db.ads_config.update_one({\"id\": \"singleton\"}, {\"$set\": doc}, upsert=True)
    return doc


# -------- Admin stats --------
@api.get(\"/admin/stats\", dependencies=[Depends(get_current_admin)])
async def admin_stats():
    total_movies = await db.movies.count_documents({})
    total_comments = await db.comments.count_documents({})
    pending = await db.comments.count_documents({\"approved\": False})
    total_views = 0
    async for m in db.movies.find({}, {\"views\": 1, \"_id\": 0}):
        total_views += m.get(\"views\", 0)
    return {
        \"movies\": total_movies,
        \"comments\": total_comments,
        \"pending_comments\": pending,
        \"total_views\": total_views,
    }


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get(\"CORS_ORIGINS\", \"*\").split(\",\"),
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)


# -------- Startup --------
SEED_MOVIES = [
    {
        \"title\": \"Cidade dos Sonhos\",
        \"synopsis\": \"Um detetive investiga um caso misterioso em uma metrópole neon onde nada é o que parece.\",
        \"year\": 2024, \"duration_min\": 128,
        \"genres\": [\"Ação\", \"Suspense\"], \"language\": \"Português\",
        \"rating\": 8.4, \"featured\": True, \"trending\": True,
        \"poster_url\": \"https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"O Último Horizonte\",
        \"synopsis\": \"Uma tripulação parte em jornada interestelar em busca de uma nova casa para a humanidade.\",
        \"year\": 2023, \"duration_min\": 142,
        \"genres\": [\"Ficção Científica\", \"Drama\"], \"language\": \"Inglês\",
        \"rating\": 9.1, \"featured\": True, \"trending\": True,
        \"poster_url\": \"https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"Amor em Lisboa\",
        \"synopsis\": \"Dois desconhecidos vagam pelas colinas de Lisboa em uma noite que muda tudo.\",
        \"year\": 2024, \"duration_min\": 104,
        \"genres\": [\"Romance\", \"Drama\"], \"language\": \"Português\",
        \"rating\": 7.8, \"trending\": True,
        \"poster_url\": \"https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"Sombras da Floresta\",
        \"synopsis\": \"Um grupo de amigos descobre um segredo aterrorizante durante um acampamento.\",
        \"year\": 2022, \"duration_min\": 96,
        \"genres\": [\"Terror\", \"Suspense\"], \"language\": \"Inglês\",
        \"rating\": 7.2,
        \"poster_url\": \"https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"O Reino Perdido\",
        \"synopsis\": \"Uma jovem guerreira precisa reunir aliados improváveis para salvar seu reino.\",
        \"year\": 2023, \"duration_min\": 135,
        \"genres\": [\"Fantasia\", \"Aventura\"], \"language\": \"Inglês\",
        \"rating\": 8.0, \"featured\": True,
        \"poster_url\": \"https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"Comédia à Meia-Noite\",
        \"synopsis\": \"Um comediante fracassado tenta o golpe da vida em uma noite maluca.\",
        \"year\": 2024, \"duration_min\": 92,
        \"genres\": [\"Comédia\"], \"language\": \"Português\",
        \"rating\": 7.4, \"trending\": True,
        \"poster_url\": \"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"A Última Batalha\",
        \"synopsis\": \"Um veterano confronta o passado em uma guerra que se recusa a acabar.\",
        \"year\": 2021, \"duration_min\": 118,
        \"genres\": [\"Ação\", \"Guerra\"], \"language\": \"Inglês\",
        \"rating\": 8.6,
        \"poster_url\": \"https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"Enigma Digital\",
        \"synopsis\": \"Um hacker desmascara uma conspiração que ameaça a privacidade global.\",
        \"year\": 2024, \"duration_min\": 111,
        \"genres\": [\"Suspense\", \"Ficção Científica\"], \"language\": \"Inglês\",
        \"rating\": 8.2, \"featured\": True,
        \"poster_url\": \"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"Verão Eterno\",
        \"synopsis\": \"Um documentário poético sobre surfistas em busca da onda perfeita.\",
        \"year\": 2022, \"duration_min\": 84,
        \"genres\": [\"Documentário\"], \"language\": \"Português\",
        \"rating\": 7.9,
        \"poster_url\": \"https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"Ritmo da Cidade\",
        \"synopsis\": \"Um dançarino de rua luta pelo sonho de estrelar um palco famoso.\",
        \"year\": 2023, \"duration_min\": 108,
        \"genres\": [\"Drama\", \"Musical\"], \"language\": \"Português\",
        \"rating\": 7.6,
        \"poster_url\": \"https://images.unsplash.com/photo-1478147427282-58a87a120781?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"Fronteira Selvagem\",
        \"synopsis\": \"Um caçador solitário protege uma reserva ameaçada por caçadores ilegais.\",
        \"year\": 2023, \"duration_min\": 121,
        \"genres\": [\"Aventura\", \"Ação\"], \"language\": \"Inglês\",
        \"rating\": 8.1,
        \"poster_url\": \"https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&auto=format&fit=crop\",
    },
    {
        \"title\": \"Além das Estrelas\",
        \"synopsis\": \"Uma astrônoma descobre um sinal que pode reescrever a história.\",
        \"year\": 2024, \"duration_min\": 129,
        \"genres\": [\"Ficção Científica\", \"Drama\"], \"language\": \"Português\",
        \"rating\": 8.8, \"trending\": True,
        \"poster_url\": \"https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=600&auto=format&fit=crop\",
        \"backdrop_url\": \"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&auto=format&fit=crop\",
    },
]
@app.on_event(\"startup\")
async def startup():
    # Indexes
    await db.movies.create_index(\"slug\", unique=True)
    await db.movies.create_index(\"id\", unique=True)
    await db.movies.create_index(\"genres\")
    await db.movies.create_index(\"year\")
    await db.comments.create_index(\"movie_id\")
    await db.admins.create_index(\"email\", unique=True)

    # Seed admin
    existing = await db.admins.find_one({\"email\": ADMIN_EMAIL.lower()})
    if not existing:
        await db.admins.insert_one({
            \"id\": str(uuid.uuid4()),
            \"email\": ADMIN_EMAIL.lower(),
            \"password_hash\": hash_password(ADMIN_PASSWORD),
            \"name\": \"Admin\",
            \"role\": \"admin\",
            \"created_at\": now_iso(),
        })
        logger.info(\"Admin seeded\")
    elif not verify_password(ADMIN_PASSWORD, existing[\"password_hash\"]):
        await db.admins.update_one(
            {\"email\": ADMIN_EMAIL.lower()},
            {\"$set\": {\"password_hash\": hash_password(ADMIN_PASSWORD)}},
        )

    # Seed movies (only if empty)
    count = await db.movies.count_documents({})
    if count == 0:
        for i, m in enumerate(SEED_MOVIES):
            doc = {
             **m,
                \"id\": str(uuid.uuid4()),
                \"slug\": slugify(m[\"title\"]) + f\"-{i+1:03d}\",
                \"views\": (i + 1) * 137,
                \"created_at\": now_iso(),
                \"original_title\": m.get(\"original_title\", \"\"),
                \"trailer_url\": m.get(\"trailer_url\", \"\"),
                \"sources\": [
                    {\"label\": \"Servidor 1\", \"url\": \"https://www.youtube.com/embed/aqz-KE-bpKQ\"},
                    {\"label\": \"Servidor 2\", \"url\": \"https://www.youtube.com/embed/dQw4w9WgXcQ\"},
                ],
                \"featured\": m.get(\"featured\", False),
                \"trending\": m.get(\"trending\", False),
            }
            try:
                await db.movies.insert_one(doc)
            except Exception:
                pass
        logger.info(f\"Seeded {len(SEED_MOVIES)} movies\")

    # Initialize storage lazily
    init_storage()


@app.on_event(\"shutdown\")
async def shutdown():
    client.close()
"
