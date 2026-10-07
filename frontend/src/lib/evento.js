import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.trim() || 'https://api.cotizaexpress.com';

// Registra un paso del usuario en el servidor (para el seguimiento de registros). Nunca falla.
export function evento(nombre) {
  try { axios.post(`${BACKEND_URL}/api/evento`, { evento: nombre }, { withCredentials: true }).catch(() => {}); } catch (e) {}
}
