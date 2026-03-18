// ===== src/modules/superadmin/layout/SuperAdminLayout.tsx =====

import { useState, useEffect } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Boxes,
  Users,
  ClipboardList,
  Ticket,
  Settings,
  Shield,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  LogOut,
  Bell,
  Menu,
  X,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { superAdminNavigation, type NavItem } from '@/shared/config/navigation'
import { useTickets } from '../hooks/useTickets'
import api from '@/shared/lib/axios'

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  CreditCard,
  Boxes,
  Users,
  ClipboardList,
  Ticket,
  Settings,
  Shield,
  PlusCircle,
}

function NavIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? Shield
  return <Icon className="h-4 w-4 shrink-0" />
}

function OpenCountBadge({ className }: { className?: string }) {
  const { data } = useTickets({ status: 'open', per_page: 1 })
  const count = data?.meta?.total ?? 0
  if (count === 0) return null
  return (
    <span
      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white tabular-nums ${className ?? ''}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function OpenCountDot() {
  const { data } = useTickets({ status: 'open', per_page: 1 })
  const count = data?.meta?.total ?? 0
  if (count === 0) return null
  return (
    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
  )
}

function SidebarNavItem({
  item,
  depth = 0,
}: {
  item: NavItem
  depth?: number
}) {
  const location = useLocation()
  const [open, setOpen] = useState(() =>
    !!item.children?.some((c) => location.pathname.startsWith(c.path)),
  )

  const isParentActive = item.children
    ? location.pathname.startsWith(item.path)
    : false

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isParentActive
              ? 'bg-slate-700/60 text-white'
              : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'
          }`}
        >
          <NavIcon name={item.icon} />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          )}
        </button>
        {open && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
            {item.children.map((child) => (
              <SidebarNavItem key={child.path} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      end={item.path !== '/admin'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'
        } ${depth > 0 ? 'py-1.5 text-[13px]' : ''}`
      }
    >
      <NavIcon name={item.icon} />
      <span className="flex-1">{item.label}</span>
      {item.badge === 'tickets_open' && <OpenCountBadge />}
    </NavLink>
  )
}

function resolveTitle(pathname: string): string {
  const exact: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/tenants': 'Ecoles',
    '/admin/tenants/create': 'Creer une ecole',
    '/admin/plans': 'Plans & Abonnements',
    '/admin/modules': 'Modules systeme',
    '/admin/users': 'Utilisateurs',
    '/admin/activity': "Journaux d'activite",
    '/admin/tickets': 'Support',
    '/admin/settings': 'Parametres',
  }
  if (exact[pathname]) return exact[pathname]
  if (/\/admin\/tenants\/[^/]+\/edit$/.test(pathname)) return "Modifier l'ecole"
  if (/\/admin\/tenants\/[^/]+\/modules$/.test(pathname)) return "Modules de l'ecole"
  if (/\/admin\/tenants\/[^/]+\/activity$/.test(pathname)) return "Activite de l'ecole"
  if (/\/admin\/tenants\/[^/]+/.test(pathname)) return 'Detail ecole'
  if (/\/admin\/plans\/[^/]+\/edit$/.test(pathname)) return 'Modifier le plan'
  if (/\/admin\/tickets\/[^/]+/.test(pathname)) return 'Ticket support'
  return 'Administration'
}

export function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await api.post('/central/auth/logout')
    } catch {
      // continue regardless
    } finally {
      clearAuth()
      navigate('/admin/login')
    }
  }

  const pageTitle = resolveTitle(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside
        className={`flex shrink-0 flex-col bg-slate-900 transition-all duration-200 ${
          sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-700/60 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold leading-none text-white">Enma School</p>
            <p className="mt-0.5 text-[10px] leading-none text-slate-400">Administration</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {superAdminNavigation.map((item) => (
            <SidebarNavItem key={item.path} item={item} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-700/60 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {user?.first_name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {user?.full_name ?? 'Super Admin'}
              </p>
              <p className="truncate text-[10px] text-slate-400">{user?.email ?? ''}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Deconnexion"
              className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="truncate text-[15px] font-semibold text-slate-900">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/tickets?status=open"
              className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
              title="Tickets ouverts"
            >
              <Bell className="h-5 w-5" />
              <OpenCountDot />
            </Link>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {user?.first_name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <span className="hidden text-sm font-medium text-slate-700 sm:block">
                {user?.first_name ?? 'Admin'}
              </span>
              <BadgeCheck className="h-4 w-4 text-indigo-500" aria-label="Super Admin" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
