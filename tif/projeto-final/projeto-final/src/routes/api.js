import { Platform } from 'react-native';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'web'
    ? (__DEV__ ? 'http://tif.test/api' : `${window.location.origin}/api`)
    : 'http://10.0.2.2/api')).replace(/\/$/, '');

let token = null;
let onUnauthorized = () => {};

export function configureSession(value, handler = () => {}) {
  token = value;
  onUnauthorized = handler;
}

export async function api(path, { method = 'GET', body } = {}) {
  const requestToken = token;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && requestToken && requestToken === token) onUnauthorized();
      const validation = Object.values(data.errors || {}).flat().join('\n');
      const fallback = response.status === 429 ? 'Muitas tentativas. Aguarde um minuto.' :
        response.status === 403 ? 'Acesso permitido apenas ao administrador.' :
          response.status === 401 ? 'Sua sessão expirou. Entre novamente.' : 'Não foi possível concluir a solicitação.';
      throw new Error(validation || data.mensagem || data.message || fallback);
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) {
      throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e o endereço da API.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
