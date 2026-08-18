import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import {
  AdminLayout,
  MinimalLayout,
  RequireAdminAuth,
  RequireBoard,
} from '@/components/layout/AdminLayout'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { LoadingSkeleton } from '@/components/shared/states'

/**
 * Lazy routes keep recharts out of the initial bundle — only the dashboard and the
 * transparency screens pull the charting library.
 */
const SignIn = lazy(() => import('@/pages/SignIn'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Devotees = lazy(() => import('@/pages/Devotees'))
const DevoteeDetail = lazy(() => import('@/pages/DevoteeDetail'))
const Bookings = lazy(() => import('@/pages/Bookings'))
const BookingsToday = lazy(() => import('@/pages/BookingsToday'))
const Catalog = lazy(() => import('@/pages/Catalog'))
const Donations = lazy(() => import('@/pages/Donations'))
const Receipts = lazy(() => import('@/pages/Receipts'))
const Memberships = lazy(() => import('@/pages/Memberships'))
const Events = lazy(() => import('@/pages/Events'))
const EventEditor = lazy(() => import('@/pages/EventEditor'))
const CalendarCMS = lazy(() => import('@/pages/CalendarCMS'))
const FacilityAdmin = lazy(() => import('@/pages/FacilityAdmin'))
const Transparency = lazy(() => import('@/pages/Transparency'))
const BoardView = lazy(() => import('@/pages/BoardView'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const RouteFallback = () => (
  <div className="py-4">
    <LoadingSkeleton variant="tiles" rows={4} />
  </div>
)

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<MinimalLayout />}>
              <Route path="/signin" element={<SignIn />} />
            </Route>

            <Route element={<RequireAdminAuth />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/devotees" element={<Devotees />} />
                <Route path="/devotees/:id" element={<DevoteeDetail />} />

                <Route path="/bookings" element={<Bookings />} />
                <Route path="/bookings/today" element={<BookingsToday />} />
                <Route path="/catalog" element={<Catalog />} />

                <Route path="/donations" element={<Donations />} />
                <Route path="/donations/receipts" element={<Receipts />} />
                <Route path="/memberships" element={<Memberships />} />

                <Route path="/events" element={<Events />} />
                <Route path="/events/new" element={<EventEditor mode="create" />} />
                <Route path="/events/:id/edit" element={<EventEditor mode="edit" />} />

                <Route path="/calendar" element={<CalendarCMS />} />
                <Route path="/facility" element={<FacilityAdmin />} />
                <Route path="/transparency" element={<Transparency />} />
                <Route path="/settings" element={<Settings />} />

                <Route element={<RequireBoard />}>
                  <Route path="/board" element={<BoardView />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  )
}
