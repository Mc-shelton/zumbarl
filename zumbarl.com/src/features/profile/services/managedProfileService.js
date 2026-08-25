import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

const readManagedProfile = (reference) => sendZumbarlApiRequest(`/connect/managed-profiles/${encodeURIComponent(reference)}`)
const listMyManagedProfiles = () => sendZumbarlApiRequest('/connect/managed-profiles/me')
const updateManagedProfile = (id, payload) => sendZumbarlApiRequest(`/connect/managed-profiles/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
const createManagedProfile = (payload) => sendZumbarlApiRequest('/connect/managed-profiles', { method: 'POST', body: JSON.stringify(payload) })
const addManagedProfileManager = (id, payload) => sendZumbarlApiRequest(`/connect/managed-profiles/${encodeURIComponent(id)}/managers`, { method: 'POST', body: JSON.stringify(payload) })
const removeManagedProfileManager = (id, userId) => sendZumbarlApiRequest(`/connect/managed-profiles/${encodeURIComponent(id)}/managers/${encodeURIComponent(userId)}`, { method: 'DELETE' })
const setManagedProfileFollow = (id, active) => sendZumbarlApiRequest(`/connect/managed-profiles/${encodeURIComponent(id)}/follow`, { method: active ? 'POST' : 'DELETE' })
const createManagedProfilePost = (id, payload) => sendZumbarlApiRequest(`/connect/managed-profiles/${encodeURIComponent(id)}/posts`, { method: 'POST', body: JSON.stringify(payload) })

export { addManagedProfileManager, createManagedProfile, createManagedProfilePost, listMyManagedProfiles, readManagedProfile, removeManagedProfileManager, setManagedProfileFollow, updateManagedProfile }
