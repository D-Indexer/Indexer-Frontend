import axe from 'axe-core'

/** Runs axe on a container and returns readable violations. Colour contrast needs real layout, so it is off in jsdom. */
export const findA11yViolations = async (container: Element) => {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  return results.violations.map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`)
}
