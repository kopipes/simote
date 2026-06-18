'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, Plus, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api, AdminUser } from '@/lib/api'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface UserFormData {
  name: string
  username: string
  email: string
  password: string
  role: string
}

interface EditFormData {
  name: string
  username: string
  email: string
  password: string
  role: string
  isActive: boolean
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<UserFormData>({ name: '', username: '', email: '', password: '', role: 'user' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<EditFormData>({ name: '', username: '', email: '', password: '', role: 'user', isActive: true })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login')
      else if (user.role !== 'admin') router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { users } = await api.adminGetUsers()
      setUsers(users)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') fetchUsers()
  }, [user, fetchUsers])

  async function handleCreateUser() {
    setCreateError('')
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError('Semua field wajib diisi')
      return
    }
    if (createForm.password.length < 8) {
      setCreateError('Password minimal 8 karakter')
      return
    }
    setCreateLoading(true)
    try {
      const { user: newUser } = await api.adminCreateUser(createForm)
      setUsers((prev) => [...prev, { ...newUser, _count: { notes: 0 } }])
      setCreateOpen(false)
      setCreateForm({ name: '', username: '', email: '', password: '', role: 'user' })
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Gagal membuat user')
    } finally {
      setCreateLoading(false)
    }
  }

  function openEditUser(u: AdminUser) {
    setEditUser(u)
    setEditForm({ name: u.name, username: u.username || '', email: u.email, password: '', role: u.role, isActive: u.isActive ?? true })
    setEditError('')
  }

  async function handleEditUser() {
    if (!editUser) return
    setEditError('')
    if (!editForm.name) { setEditError('Nama wajib diisi'); return }
    if (!editForm.email) { setEditError('Email wajib diisi'); return }
    if (editForm.password && editForm.password.length < 8) {
      setEditError('Password minimal 8 karakter')
      return
    }
    setEditLoading(true)
    try {
      const data: { name: string; username?: string; email: string; role: string; isActive: boolean; password?: string } = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive,
      }
      if (editForm.username) data.username = editForm.username
      if (editForm.password) data.password = editForm.password
      const { user: updated } = await api.adminUpdateUser(editUser.id, data)
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, ...updated } : u))
      setEditUser(null)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Gagal update user')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleToggleActive(u: AdminUser) {
    try {
      const { user: updated } = await api.adminUpdateUser(u.id, { isActive: !u.isActive })
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, ...updated } : x))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengubah status user')
    }
  }

  async function handleDeleteUser() {
    if (!confirmDelete) return
    try {
      await api.adminDeleteUser(confirmDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id))
      setConfirmDelete(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus user')
      setConfirmDelete(null)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard" className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Kembali">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h1 className="font-semibold text-gray-900">Admin Panel</h1>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah User</span>
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Nama</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Username</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Notes</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-indigo-600">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{u.name}</span>
                          {u.id === user.id && (
                            <span className="text-xs text-gray-400">(kamu)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{u.username || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u._count.notes}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditUser(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== user.id && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleActive(u)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                aria-label={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(u)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                aria-label="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold">Tambah User</h2>
              <button type="button" onClick={() => setCreateOpen(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100" aria-label="Tutup">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {createError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{createError}</div>}
              {([{ key: 'name', label: 'Nama', type: 'text', placeholder: 'Nama lengkap' },
                { key: 'username', label: 'Username (opsional)', type: 'text', placeholder: 'contoh: john_doe' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
                { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 karakter' }] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={createForm[f.key]}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
                <button type="button" onClick={handleCreateUser} disabled={createLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium">
                  {createLoading ? 'Menyimpan...' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditUser(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold">Edit User: {editUser.name}</h2>
              <button type="button" onClick={() => setEditUser(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100" aria-label="Tutup">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {editError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{editError}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Nama</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Username <span className="text-gray-400">(untuk login, opsional)</span></label>
                <input type="text" value={editForm.username} onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value.toLowerCase() }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="contoh: john_doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Password Baru <span className="text-gray-400">(kosongkan jika tidak diubah)</span></label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Min. 8 karakter" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editUser.id !== user.id && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Status Akun</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, isActive: true }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        editForm.isActive
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                      }`}
                    >
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, isActive: false }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        !editForm.isActive
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                      }`}
                    >
                      Nonaktif
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
                <button type="button" onClick={handleEditUser} disabled={editLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium">
                  {editLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Hapus User?"
        message={`Akun "${confirmDelete?.name}" dan semua datanya akan dihapus permanen.`}
        confirmLabel="Hapus"
        danger
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
