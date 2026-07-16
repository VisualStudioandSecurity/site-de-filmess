"import axios from \"axios\";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Attach bearer token from localStorage (fallback when cookies fail cross-origin)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(\"mh_token\");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatErr(detail) {
  if (detail == null) return \"Algo deu errado.\";
  if (typeof detail === \"string\") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(\" \");
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export function posterUrl(m) {
  if (!m) return \"\";
  if (m.poster_url?.startsWith(\"http\")) return m.poster_url;
  if (m.poster_url?.startsWith(\"/api/\")) return `${BACKEND_URL}${m.poster_url}`;
  return m.poster_url || \"\";
}

export function backdropUrl(m) {
  if (!m) return \"\";
  if (m.backdrop_url?.startsWith(\"http\")) return m.backdrop_url;
  if (m.backdrop_url?.startsWith(\"/api/\")) return `${BACKEND_URL}${m.backdrop_url}`;
  return m.backdrop_url || posterUrl(m);
}
"
