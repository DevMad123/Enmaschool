import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Get token from localStorage (same pattern as axios interceptor)
function getToken(): string {
  try {
    const auth = localStorage.getItem('auth-storage')
    if (auth) {
      const parsed = JSON.parse(auth)
      return parsed?.state?.token ?? ''
    }
  } catch {}
  return ''
}

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${import.meta.env.VITE_API_URL ?? ''}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  },
})
