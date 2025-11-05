
// src/utils/authGuard.ts
import { parse } from 'cookie';
import { jwtVerify } from 'jose';


/**
 * Función de guarda de autenticación para proteger rutas en Astro.
 * Se puede usar en el frontmatter de las páginas .astro.
 * @param context El contexto de la API de Astro.
 * @returns Una redirección a /login si el usuario no está autenticado.
 */
export async function requireAuth(Astro: any) {
  const cookies = parse(Astro.request.headers.get('cookie') || '');
  const accessToken = cookies.accessToken;
  const refreshToken = cookies.refreshToken;

  if (!accessToken) return Astro.redirect('/login');

  try {
    // Verificamos el access token
    await jwtVerify(
      accessToken,
      new TextEncoder().encode(import.meta.env.JWT_SECRET)
    );
    return;
  } catch (err: any) {
    // Si expiró, intentamos usar el refresh token
    if (err.code === 'ERR_JWT_EXPIRED' && refreshToken) {
      try {
        await jwtVerify(
          refreshToken,
          new TextEncoder().encode(import.meta.env.JWT_REFRESH_SECRET)
        );

        // Si el refresh token es válido, pedimos uno nuevo al backend
        const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (res.ok) {
          const { accessToken: newAccessToken } = await res.json();
          Astro.response.headers.append(
            'Set-Cookie',
            `accessToken=${newAccessToken}; Path=/; HttpOnly; Secure; SameSite=Strict`
          );
          return;
        }
      } catch {
        return Astro.redirect('/login');
      }
    }

    return Astro.redirect('/login');
  }
}


