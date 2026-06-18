// Thin fetch wrappers for API calls

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  // Some responses (e.g. 204 No Content) have no body
  const text = await res.text()
  let data: Record<string, unknown> = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (!res.ok) throw new Error(`Server error (${res.status})`)
    }
  }
  if (!res.ok) throw new Error((data.error as string) || `Request failed (${res.status})`)
  return data as T
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string, username?: string) =>
    apiFetch<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, username }),
    }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch<{ user: User }>('/api/auth/me'),

  // Notes
  getNotes: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<{ notes: Note[] }>(`/api/notes${qs}`)
  },
  createNote: (data: CreateNoteInput) =>
    apiFetch<{ note: Note }>('/api/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: string, data: Partial<CreateNoteInput> & { status?: string }) =>
    apiFetch<{ note: Note }>(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id: string) =>
    apiFetch<{ ok: boolean; permanent: boolean }>(`/api/notes/${id}`, { method: 'DELETE' }),
  restoreNote: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/notes/${id}/restore`, { method: 'POST' }),

  // Categories
  getCategories: () => apiFetch<{ categories: Category[] }>('/api/categories'),
  createCategory: (name: string, colorHex: string) =>
    apiFetch<{ category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, colorHex }),
    }),
  updateCategory: (id: string, data: { name?: string; colorHex?: string }) =>
    apiFetch<{ category: Category }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    apiFetch(`/api/categories/${id}`, { method: 'DELETE' }),

  // Admin
  adminGetUsers: () => apiFetch<{ users: AdminUser[] }>('/api/admin/users'),
  adminCreateUser: (data: { name: string; username?: string; email: string; password: string; role: string }) =>
    apiFetch<{ user: AdminUser }>('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateUser: (id: string, data: { name?: string; username?: string; email?: string; password?: string; role?: string; isActive?: boolean }) =>
    apiFetch<{ user: AdminUser }>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  adminDeleteUser: (id: string) =>
    apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' }),
}

// Types
export interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export interface AdminUser extends User {
  username: string | null
  createdAt: string
  _count: { notes: number }
}

export interface NoteField {
  id: string
  noteId: string
  fieldKey: string
  fieldValue: string
  isSensitive: boolean
  sortOrder: number
}

export interface Category {
  id: string
  userId: string
  name: string
  colorHex: string
  createdAt: string
  updatedAt: string
  _count?: { noteCategories: number }
}

export interface Note {
  id: string
  userId: string
  type: 'note' | 'ssh' | 'login' | 'api'
  title: string
  status: 'active' | 'invalid'
  createdAt: string
  updatedAt: string
  fields: NoteField[]
  noteCategories: { noteId: string; categoryId: string; category: Category }[]
  trashedItem: TrashedItem | null
}

export interface TrashedItem {
  id: string
  noteId: string
  deletedById: string
  deletedAt: string
  expiresAt: string
  restoredAt: string | null
}

export interface CreateNoteInput {
  type: string
  title: string
  fields: { fieldKey: string; fieldValue: string; isSensitive: boolean; sortOrder?: number }[]
  categoryIds: string[]
}
