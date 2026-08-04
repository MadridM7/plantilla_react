const isDev = import.meta.env.DEV;

// Punto único para loguear errores del front. En un proyecto real, el rama
// "producción" es donde se conectaría un servicio externo (Sentry, etc.)
// en vez de solo silenciar el mensaje.
export const logger = {
  error: (...args) => {
    if (isDev) console.error(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
};
