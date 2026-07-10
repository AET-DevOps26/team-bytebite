import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Save, KeyRound } from 'lucide-react'
import { AlertBanner } from './AlertBanner'
import type { AuthUser } from './AuthCard'

interface ProfileViewProps {
  user: AuthUser
  // Updates name/email. Returns null on success, or an error message to display.
  onUpdateProfile: (name: string, email: string) => Promise<string | null>
  // Changes the password. Returns null on success (caller then logs out), or an error message.
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<string | null>
}

const inputCls =
  'w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-950/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2d6a4f]/70 focus:ring-2 focus:ring-[#2d6a4f]/15'
const labelCls = 'block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300'
const cardCls =
  'bg-white/85 dark:bg-gray-900/85 backdrop-blur-2xl border border-gray-200/60 dark:border-gray-800/60 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 p-8'
const buttonCls =
  'w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#1b5e38] to-[#2d6a4f] text-white font-semibold text-sm shadow-lg shadow-green-900/25 disabled:opacity-60 disabled:cursor-not-allowed'

export function ProfileView({ user, onUpdateProfile, onChangePassword }: ProfileViewProps) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const profileDirty = name.trim() !== user.name || email.trim() !== user.email

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setSavingProfile(true)
    const error = await onUpdateProfile(name.trim(), email.trim())
    setSavingProfile(false)
    if (error) {
      setProfileError(error)
    } else {
      setProfileSuccess('Profile updated.')
    }
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setSavingPassword(true)
    const error = await onChangePassword(currentPassword, newPassword)
    // On success the app logs the user out; show a brief confirmation in the meantime.
    if (error) {
      setSavingPassword(false)
      setPasswordError(error)
    } else {
      setPasswordSuccess('Password changed — please sign in again.')
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