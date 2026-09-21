import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { paths } from '../../routes'

interface MissingRecordProps {
  /** What could not be found, e.g. "form". */
  subject: string
  /** Shown to explain what probably happened. */
  description?: string
}

/**
 * Shown when a route points at a template or response that is not in storage,
 * reachable in normal use via a stale bookmark or a second tab. It gets a real
 * explanation and a way out rather than a blank screen.
 */
export function MissingRecord({ subject, description }: MissingRecordProps) {
  const navigate = useNavigate()

  return (
    <EmptyState
      icon="alert"
      title={`That ${subject} no longer exists`}
      description={
        description ?? `It may have been deleted, or the link may be out of date.`
      }
      action={
        <Button variant="primary" icon="arrow-left" onClick={() => navigate(paths.templates)}>
          Back to templates
        </Button>
      }
    />
  )
}
