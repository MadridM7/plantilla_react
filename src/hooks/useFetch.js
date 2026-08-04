import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../services/apiClient.js";
import { logger } from "../utils/logger.js";

// Hook de ejemplo: encapsula loading/error/data para que los componentes
// nunca tengan que manejar una promesa rechazada directamente.
export function useFetch(path, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });

  const run = useCallback(async () => {
    if (!path) return;
    setState({ data: null, error: null, loading: true });
    try {
      const data = await apiClient.get(path);
      setState({ data, error: null, loading: false });
    } catch (error) {
      logger.error("useFetch error:", error);
      setState({ data: null, error, loading: false });
    }
  }, [path]);

  useEffect(() => {
    if (enabled) run();
  }, [enabled, run]);

  return { ...state, refetch: run };
}
