import axios from "axios";
import { API_BASE_URL } from "../constants/index.js";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  // Necesario para que la cookie httpOnly del token CSRF (ver plantilla-node)
  // viaje entre orígenes distintos (front y API en puertos diferentes).
  withCredentials: true,
});

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

// La cookie del token CSRF es httpOnly a propósito (para que un XSS no
// pueda leerla) — por eso NO se puede usar el mecanismo automático de
// axios (xsrfCookieName), que lee document.cookie. En vez de eso, el token
// se pide una sola vez por el BODY de la respuesta de GET /csrf-token y se
// guarda en memoria; el interceptor lo reenvía solo en cada request que
// muta estado, sin que cada llamada tenga que acordarse de hacerlo.
let csrfTokenPromise = null;

function fetchCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = axios
      .get(`${API_BASE_URL}/csrf-token`, { withCredentials: true })
      .then((res) => res.data.csrfToken)
      .catch((err) => {
        csrfTokenPromise = null; // permite reintentar en la próxima llamada
        throw err;
      });
  }
  return csrfTokenPromise;
}

http.interceptors.request.use(async (config) => {
  if (config.method && MUTATING_METHODS.has(config.method.toLowerCase())) {
    config.headers["X-CSRF-Token"] = await fetchCsrfToken();
  }
  return config;
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === "ECONNABORTED") {
      throw new ApiError(`Timeout al llamar a ${error.config?.url}`, 408);
    }
    if (error.response) {
      // 403 de CSRF: el token en memoria pudo quedar viejo (cookie
      // expirada); se descarta para que el próximo intento pida uno nuevo.
      if (error.response.status === 403) {
        csrfTokenPromise = null;
      }
      throw new ApiError(
        `Error ${error.response.status} al llamar a ${error.config?.url}`,
        error.response.status,
        error.response.data
      );
    }
    throw new ApiError(error.message || "Error de red", 0);
  }
);

export const apiClient = {
  get: (path, config) => http.get(path, config),
  post: (path, body, config) => http.post(path, body, config),
};
