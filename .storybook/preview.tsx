import type { Decorator, Preview } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import '../src/styles/index.css'

/** Router context every story needs (LinkButton, FolderSummary, …). */
const withRouter: Decorator = (Story) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
)

const preview: Preview = {
  decorators: [withRouter],
  parameters: {
    a11y: { test: 'error' },
    controls: { expanded: true },
  },
}

export default preview
