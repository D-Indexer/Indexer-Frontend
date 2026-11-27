import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ServicesProvider, type ServicesRegistry } from '@/services/context/ServicesContext'

export const renderWithServices = (
  ui: ReactElement,
  overrides?: Partial<ServicesRegistry>,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(
    <ServicesProvider services={overrides}>
      {ui}
    </ServicesProvider>,
    options,
  )
}
