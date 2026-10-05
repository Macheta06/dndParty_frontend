import axios from "axios";

/**
 * Extrae el mensaje que devolvió el server (NestJS responde
 * `{ statusCode, message }`) y, si no hay, usa el fallback.
 *
 * `err.message` de axios solo dice "Request failed with status code 400",
 * que no le sirve al usuario.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string | string[] }
      | undefined;

    // `err.message` de axios solo dice "Request failed with status code 400":
    // si el server no mandó un mensaje, el fallback le sirve más al usuario.
    if (!data?.message) return fallback;

    return Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;
  }

  if (err instanceof Error && err.message) return err.message;

  return fallback;
}
