/**
 * The URL scheme, named in one place.
 *
 * Routing itself is react-router's, mounted in `main.tsx` and matched in
 * `App.tsx`. What is left here is the vocabulary: every path the app can point at,
 * so a page writes `paths.fill(id)` rather than spelling the URL out and no two
 * pages can disagree about what a link looks like.
 *
 * Hash routing, which is why these are paths *inside* the hash. Nothing rewrites
 * `/templates/abc/edit` back to `index.html` on a static host, but everything
 * after `#` is the client's business, so a refresh on a deep link works anywhere.
 */

/**
 * The template id meaning "a new form, not saved yet". A routing sentinel rather
 * than a stored one: no record with this id is ever written, and the builder
 * serves this route from its in-memory draft.
 */
export const DRAFT_TEMPLATE_ID = 'new'

export const paths = {
  templates: '/',
  newTemplate: `/templates/${DRAFT_TEMPLATE_ID}/edit`,
  builder: (templateId: string) => `/templates/${templateId}/edit`,
  fill: (templateId: string) => `/templates/${templateId}/fill`,
  instances: (templateId: string) => `/templates/${templateId}/instances`,
  instance: (instanceId: string) => `/instances/${instanceId}`,
} as const
