import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'

// The gate in front of every authenticated route, replacing the early `return <AuthCard/>` that
// used to shadow the whole app. A stored session renders straight through while it is being
// revalidated, so a refresh never flashes the login screen; only a confirmed-anonymous session is
// redirected, and it carries the attempted location so login can send the user back to it.
export function RequireAuth() {
  const { token, user } = useAuth()
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
