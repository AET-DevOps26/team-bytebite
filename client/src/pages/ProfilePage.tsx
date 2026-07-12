import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Save, KeyRound } from 'lucide-react'
import { AlertBanner } from '../components/AlertBanner'
import { useAuth } from '../contexts/authContext'
import { errorMessage } from '../lib/api'
import type { AuthPayload } from '../types'

const inputCls =
  'w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-950/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2d6a4f]/70 focus:ring-2 focus:ring-[#2d6a4f]/15'
const labelCls = 'block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300'
const cardCls =
  'bg-white/85 dark:bg-gray-900/85 backdrop-blur-2xl border border-gray-200/60 dark:border-gray-800/60 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 p-8'
const buttonCls =
  'w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#1b5e38] to-[#2d6a4f] text-white font-semibold text-sm shadow-lg shadow-green-900/25 disabled:opacity-60 disabled:cursor-not-allowed'

export function ProfilePage() {
  const { user, api, signIn, signOut } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // The route guard only mounts this page for a signed-in user; the check keeps TypeScript happy.
  if (!user) return null

  const profileDirty = name.trim() !== user.name || email.trim() !== user.email

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setSavingProfile(true)
    try {
      // The JWT embeds name/email, so the server re-issues it; the response is a whole new session.
      signIn(await api.patch<AuthPayload>('/users/me', { name: name.trim(), email: email.trim() }))
      setProfileSuccess('Profile updated.')
    } catch (error) {
      setProfileError(errorMessage(error, 'Failed to update profile.'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setSavingPassword(true)
    try {
      // A wrong current password also answers 401, so this call must not trip the session teardown.
      await api.put('/users/me/password', { currentPassword, newPassword }, { signOutOn401: false })
      // Stay in the saving state and pause briefly so the confirmation is readable before the
      // sign-out drops us back to the login screen.
      setPasswordSuccess('Password changed — please sign in again.')
      setTimeout(signOut, 1200)
    } catch (error) {
      setSavingPassword(false)
      setPasswordError(errorMessage(error, 'Failed to change password.'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account details.</p>
      </div>

      {/* Profile details */}
      <motion.form
        onSubmit={handleProfileSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${cardCls} space-y-4`}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account details</h2>

        <label className="block">
          <span className={labelCls}>Name</span>
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            autoComplete="name"
            required
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className={labelCls}>Email</span>
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="email"
            required
            className={inputCls}
          />
        </label>

        <AlertBanner type="error" message={profileError} visible={!!profileError} />
        <AlertBanner type="success" message={profileSuccess} visible={!!profileSuccess} />

        <motion.button
          type="submit"
          disabled={savingProfile || !profileDirty}
          whileHover={!savingProfile && profileDirty ? { y: -2 } : {}}
          whileTap={!savingProfile && profileDirty ? { scale: 0.98, y: 0 } : {}}
          className={buttonCls}
        >
          {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {savingProfile ? 'Saving' : 'Save changes'}
        </motion.button>
      </motion.form>

      {/* Change password */}
      <motion.form
        onSubmit={handlePasswordSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className={`${cardCls} space-y-4`}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change password</h2>

        <label className="block">
          <span className={labelCls}>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className={labelCls}>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className={inputCls}
          />
        </label>

        <AlertBanner type="error" message={passwordError} visible={!!passwordError} />
        <AlertBanner type="success" message={passwordSuccess} visible={!!passwordSuccess} />

        <motion.button
          type="submit"
          disabled={savingPassword}
          whileHover={!savingPassword ? { y: -2 } : {}}
          whileTap={!savingPassword ? { scale: 0.98, y: 0 } : {}}
          className={buttonCls}
        >
          {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          {savingPassword ? 'Saving' : 'Change password'}
        </motion.button>
      </motion.form>
    </div>
  )
}