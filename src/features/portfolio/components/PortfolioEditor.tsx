import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormField } from '@/components/forms'
import { Button, Card, ErrorMessage } from '@/components/ui'
import { ipfsService, portfolioApi, toApiError } from '@/services'
import { usePortfolioStore } from '@/store'
import type { PortfolioMetadata } from '@/types'
import { getInvalidUrls, isRequired, parseDelimitedList } from '@/utils/validation'

type PortfolioFormData = {
  bio: string
  links: string
  name: string
  skills: string
}

type PortfolioFormErrors = Partial<Record<keyof PortfolioFormData | 'templateId', string>>

export const PortfolioEditor = () => {
  const [searchParams] = useSearchParams()
  const initialTemplate = searchParams.get('template') ?? 'developer'
  const [templateId, setTemplateId] = useState(initialTemplate)
  const [formData, setFormData] = useState<PortfolioFormData>({
    name: '',
    bio: '',
    links: '',
    skills: '',
  })
  const [fieldErrors, setFieldErrors] = useState<PortfolioFormErrors>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCid, setCreatedCid] = useState<string | null>(null)
  const { addPortfolio } = usePortfolioStore()

  const updateField = (field: keyof PortfolioFormData) => {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({ ...current, [field]: event.target.value }))
    }
  }

  const metadata = useMemo<PortfolioMetadata>(
    () => ({
      name: formData.name.trim(),
      bio: formData.bio.trim(),
      links: parseDelimitedList(formData.links),
      skills: parseDelimitedList(formData.skills),
    }),
    [formData],
  )

  const validateForm = () => {
    const errors: PortfolioFormErrors = {}
    if (!isRequired(metadata.name) || !isRequired(metadata.bio)) {
      errors.name = !isRequired(metadata.name) ? 'Portfolio name is required.' : undefined
      errors.bio = !isRequired(metadata.bio) ? 'Bio is required.' : undefined
    }

    if (!isRequired(templateId)) {
      errors.templateId = 'Template ID is required.'
    }

    const invalidUrls = getInvalidUrls(metadata.links)
    if (invalidUrls.length > 0) {
      errors.links = 'Links must be valid http or https URLs.'
    }

    setFieldErrors(errors)
    return Object.values(errors).every((value) => !value)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const cid = await ipfsService.uploadJSON(metadata)
      const response = await portfolioApi.create(templateId, cid)
      addPortfolio(response.data)
      setCreatedCid(cid)
      setFieldErrors({})
    } catch (requestError) {
      setError(toApiError(requestError).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="form">
        {error ? <ErrorMessage message={error} /> : null}
        {createdCid ? <p className="muted">Metadata uploaded: {createdCid}</p> : null}

        <FormField
          id="templateId"
          label="Template ID"
          error={fieldErrors.templateId}
          value={templateId}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setTemplateId(event.target.value)}
          required
        />

        <FormField
          id="name"
          label="Portfolio name"
          error={fieldErrors.name}
          placeholder="Jane Doe, Product Engineer"
          value={formData.name}
          onChange={updateField('name')}
          required
        />

        <FormField
          control="textarea"
          id="bio"
          label="Bio"
          error={fieldErrors.bio}
          placeholder="Summarize the work this portfolio should prove."
          value={formData.bio}
          onChange={updateField('bio')}
          required
        />

        <FormField
          id="skills"
          label="Skills"
          helpText="Separate skills with commas."
          placeholder="React, Stellar, TypeScript"
          value={formData.skills}
          onChange={updateField('skills')}
        />

        <FormField
          id="links"
          label="Links"
          error={fieldErrors.links}
          helpText="Separate links with commas."
          placeholder="https://github.com/example, https://portfolio.example"
          value={formData.links}
          onChange={updateField('links')}
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating portfolio…' : 'Create portfolio'}
        </Button>
      </form>
    </Card>
  )
}
