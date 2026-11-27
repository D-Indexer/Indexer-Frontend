import { describe, expect, it } from 'vitest'
import { getContrastRatio, templateThemes } from './theme'

describe('Template Themes WCAG Contrast Verification', () => {
  it('ensures text on background has contrast ratio >= 4.5:1 across all light and dark themes', () => {
    Object.entries(templateThemes).forEach(([id, themeDef]) => {
      // Light mode text vs background
      const lightContrast = getContrastRatio(themeDef.light.text, themeDef.light.background)
      expect(
        lightContrast,
        `Template ${id} light mode text (${themeDef.light.text}) on background (${themeDef.light.background}) failed WCAG AA`,
      ).toBeGreaterThanOrEqual(4.5)

      // Light mode text vs surface
      const lightSurfaceContrast = getContrastRatio(themeDef.light.text, themeDef.light.surface)
      expect(
        lightSurfaceContrast,
        `Template ${id} light mode text (${themeDef.light.text}) on surface (${themeDef.light.surface}) failed WCAG AA`,
      ).toBeGreaterThanOrEqual(4.5)

      // Dark mode text vs background
      const darkContrast = getContrastRatio(themeDef.dark.text, themeDef.dark.background)
      expect(
        darkContrast,
        `Template ${id} dark mode text (${themeDef.dark.text}) on background (${themeDef.dark.background}) failed WCAG AA`,
      ).toBeGreaterThanOrEqual(4.5)

      // Dark mode text vs surface
      const darkSurfaceContrast = getContrastRatio(themeDef.dark.text, themeDef.dark.surface)
      expect(
        darkSurfaceContrast,
        `Template ${id} dark mode text (${themeDef.dark.text}) on surface (${themeDef.dark.surface}) failed WCAG AA`,
      ).toBeGreaterThanOrEqual(4.5)
    })
  })
})
