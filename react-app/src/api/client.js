import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ── Auth ──────────────────────────────────────────────────────────────────
export const checkSession  = ()        => api.get('/auth.php?action=check')
export const login         = (data)    => api.post('/auth.php?action=login', data)
export const logout        = ()        => api.post('/auth.php?action=logout')

// ── Dashboard ────────────────────────────────────────────────────────────
export const getDashboard  = ()        => api.get('/dashboard.php')

// ── Applicants ─────────────────────────────────────────────────────────────
export const getApplicants   = (params)  => api.get('/applicants.php', { params })
export const getApplicant    = (id)      => api.get('/applicants.php', { params: { action:'single', id } })
export const createApplicant = (data)    => api.post('/applicants.php', data)
export const updateApplicant = (id, d)   => api.put(`/applicants.php?id=${id}`, d)
export const deleteApplicant = (id)      => api.delete(`/applicants.php?id=${id}`)
export const bulkAction      = (data)    => api.post('/applicants.php?action=bulk', data)
export const saveComment     = (data)    => api.post('/applicants.php?action=comment', data)

// ── Shortlisted ────────────────────────────────────────────────────────────
export const getShortlisted = (params)  => api.get('/shortlisted.php', { params })

// ── Verified ───────────────────────────────────────────────────────────────
export const getVerified    = (params)  => api.get('/verified.php', { params })

// ── Admitted (daily report) ────────────────────────────────────────────────
export const getAdmitted    = (params)  => api.get('/admitted.php', { params })
export const getAdmittedDay = (params)  => api.get('/admitted.php?action=day', { params })

// ── Users ──────────────────────────────────────────────────────────────────
export const getUsers    = (params)  => api.get('/users.php', { params })
export const getUser     = (id)      => api.get('/users.php', { params: { action:'single', id } })
export const createUser  = (data)    => api.post('/users.php', data)
export const updateUser  = (id, d)   => api.put(`/users.php?id=${id}`, d)
export const deleteUser  = (id)      => api.delete(`/users.php?id=${id}`)

// ── Upload ─────────────────────────────────────────────────────────────────
export const uploadCSV = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/upload.php', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// ── Export URL ─────────────────────────────────────────────────────────────
export const exportUrl = (type, program = '') =>
  `/api/export.php?type=${type}${program ? `&program=${encodeURIComponent(program)}` : ''}`

// ── Interview Dates ────────────────────────────────────────────────────────
export const getInterviewDatesGroups = (params) => api.get('/dates.php', { params })
export const assignInterviewDate     = (data)   => api.post('/dates.php?action=assign', data)
export const clearInterviewDate      = (id)     => api.delete(`/dates.php?action=clear&id=${id}`)
export const uploadInterviewDates    = (file)   => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/dates.php?action=upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const bulkScheduleUpload = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/bulk_schedule.php', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// ── Sources ────────────────────────────────────────────────────────────────
export const getSources      = (params) => api.get('/sources.php', { params })
export const getSourceDetail = (params) => api.get('/sources.php?action=detail', { params })

export default api
