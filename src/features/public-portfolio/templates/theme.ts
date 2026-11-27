import type React from 'react'

export interface TemplateTheme {
  background: string
  fontFamily?: string
  muted: string
  primary: string
  spacingScale?: string
  surface: string
  text: string
}

export interface TemplateThemeDefinition {
  dark: TemplateTheme
  light: TemplateTheme
}

export const templateThemes: Record<number, TemplateThemeDefinition> = {
  // 1: Developer
  1: {
    light: {
      primary: '#0284c7',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      muted: '#475569',
      fontFamily: 'ui-monospace, monospace',
      spacingScale: '1rem',
    },
    dark: {
      primary: '#38bdf8',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      muted: '#94a3b8',
      fontFamily: 'ui-monospace, monospace',
      spacingScale: '1rem',
    },
  },
  // 2: Designer
  2: {
    light: {
      primary: '#7c3aed',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#2e1065',
      muted: '#6b21a8',
      fontFamily: 'system-ui, sans-serif',
      spacingScale: '1.25rem',
    },
    dark: {
      primary: '#a78bfa',
      background: '#1e1035',
      surface: '#2d1b4e',
      text: '#f5f3ff',
      muted: '#c4b5fd',
      fontFamily: 'system-ui, sans-serif',
      spacingScale: '1.25rem',
    },
  },
  // 3: Operations
  3: {
    light: {
      primary: '#0f766e',
      background: '#f0fdfa',
      surface: '#ffffff',
      text: '#134e4a',
      muted: '#115e59',
      fontFamily: 'system-ui, sans-serif',
      spacingScale: '1rem',
    },
    dark: {
      primary: '#2dd4bf',
      background: '#042f2e',
      surface: '#115e59',
      text: '#f0fdfa',
      muted: '#99f6e4',
      fontFamily: 'system-ui, sans-serif',
      spacingScale: '1rem',
    },
  },
}

export const getTemplateThemeStyles = (templateId: number | null, isDark = false): React.CSSProperties => {
  const def = (templateId && templateThemes[templateId]) || templateThemes[1]
  const theme = isDark ? def.dark : def.light

  return {
    ['--tpl-color-primary' as string]: theme.primary,
    ['--tpl-color-bg' as string]: theme.background,
    ['--tpl-color-surface' as string]: theme.surface,
    ['--tpl-color-text' as string]: theme.text,
    ['--tpl-color-muted' as string]: theme.muted,
    ['--tpl-font-family' as string]: theme.fontFamily ?? 'inherit',
    ['--tpl-spacing-unit' as string]: theme.spacingScale ?? '1rem',
  }
}

/** Computes WCAG 2.1 relative luminance for an sRGB hex color. */
export const getRelativeLuminance = (hex: string): number => {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255

  const srgb = [r, g, b].map((val) => (val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)))
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

/** Computes WCAG 2.1 contrast ratio between two hex colors. */
export const getContrastRatio = (foreground: string, background: string): number => {
  const l1 = getRelativeLuminance(foreground)
  const l2 = getRelativeLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}
