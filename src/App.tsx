import { useEffect } from 'react'
import { Route, Routes, useLocation, useParams } from 'react-router-dom'
import { BuilderPage } from './pages/BuilderPage'
import { FillPage } from './pages/FillPage'
import { InstanceDetailPage } from './pages/InstanceDetailPage'
import { InstancesPage } from './pages/InstancesPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { paths } from './routes'

/**
 * The route table.
 *
 * A route carrying a record id renders a small wrapper rather than the page
 * directly, so the page can be keyed by that id: navigating between two records
 * remounts it rather than asking it to reconcile two records inside one state
 * object, the difference between "the builder shows the form I clicked" and "the
 * builder shows the last form's fields with the new form's title".
 */
function BuilderRoute() {
  const { templateId = '' } = useParams()
  return <BuilderPage key={templateId} templateId={templateId} />
}

function FillRoute() {
  const { templateId = '' } = useParams()
  return <FillPage key={templateId} templateId={templateId} />
}

function InstancesRoute() {
  const { templateId = '' } = useParams()
  return <InstancesPage key={templateId} templateId={templateId} />
}

function InstanceDetailRoute() {
  const { instanceId = '' } = useParams()
  return <InstanceDetailPage key={instanceId} instanceId={instanceId} />
}

/**
 * Scroll to the top on navigation, which is the expectation a multi-page app
 * sets. Without it a long form keeps its old scroll offset.
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path={paths.templates} element={<TemplatesPage />} />
        <Route path="/templates/:templateId/edit" element={<BuilderRoute />} />
        <Route path="/templates/:templateId/fill" element={<FillRoute />} />
        <Route path="/templates/:templateId/instances" element={<InstancesRoute />} />
        <Route path="/templates/:templateId" element={<BuilderRoute />} />
        <Route path="/templates/:templateId/*" element={<BuilderRoute />} />
        <Route path="/instances/:instanceId" element={<InstanceDetailRoute />} />
        <Route path="/instances/:instanceId/*" element={<InstanceDetailRoute />} />
        {/* Anything else lands on the list, as it always has. */}
        <Route path="*" element={<TemplatesPage />} />
      </Routes>
    </>
  )
}

export default App
