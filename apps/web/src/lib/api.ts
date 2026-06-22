import axios from 'axios'

export const api = axios.create({
  baseURL: typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'),
})
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export const authApi = {
  login: (data: { tenantSlug: string; email: string; password: string }) =>
    api.post('/api/auth/login', data).then((r) => r.data),
  register: (data: any) => api.post('/api/auth/register', data).then((r) => r.data),
}

export const bookingApi = {
  getSlots: (params: { providerId: string; serviceId: string; date: string }) =>
    api.get('/api/bookings/slots', { params }).then((r) => r.data),
  create: (data: any) => api.post('/api/bookings', data).then((r) => r.data),
  list: (params?: { date?: string }) => api.get('/api/bookings', { params }).then((r) => r.data),
  cancel: (id: string) => api.delete(`/api/bookings/${id}`).then((r) => r.data),
}

export const tenantApi = {
  get: (slug: string) => api.get(`/api/tenants/${slug}`).then((r) => r.data),
}

export const paymentApi = {
  create: (data: { bookingId: string; method: string }) =>
    api.post('/api/payments', data).then((r) => r.data),
}
