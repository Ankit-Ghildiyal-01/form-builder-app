/**
 * Values that are decisions rather than data shapes.
 *
 * `types.ts` describes what gets stored; this file holds the numbers those
 * shapes are governed by, so a file named for types does not export any.
 */

/** Bumped when the persisted shape changes in a way `parseSchema` must migrate. */
export const STORAGE_VERSION = 1

/**
 * Length caps for the strings that name things rather than carry answers.
 *
 * A label is a heading in the PDF and a single clipped line in the canvas, and a
 * title is a card heading in the grid, so all three want to stay short enough to
 * survive those places. Enforced with `maxLength` on the inputs that write them.
 */
export const FIELD_LABEL_MAX_LENGTH = 70
export const FORM_TITLE_MAX_LENGTH = 70
export const FORM_DESCRIPTION_MAX_LENGTH = 250
