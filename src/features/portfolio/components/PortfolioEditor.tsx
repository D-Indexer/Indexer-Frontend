import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, ErrorMessage } from '@/components/ui'
import { ipfsService, portfolioApi, toApiError } from '@/services'
import { usePortfolioStore } from '@/store'
import type { PortfolioMetadata } from '@/types'
import { isRequired, parseDelimitedList } from '@/utils/validation'

export const PortfolioEditor = () => {
  const [searchParams] = useSearchParams()
  const initialTemplate = searchParams.get('template') ?? 'developer'
  const [templateId, setTemplateId] = useState(initialTemplate)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    links: '',
    skills: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCid, setCreatedCid] = useState<string | null>(null)
  const { addPortfolio } = usePortfolioStore()

  const metadata = useMemo<PortfolioMetadata>(
    () => ({
      name: formData.name.trim(),
      bio: formData.bio.trim(),
      links: parseDelimitedList(formData.links),
      skills: parseDelimitedList(formData.skills),
    }),
    [formData],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!isRequired(metadata.name) || !isRequired(metadata.bio)) {
      setError('Portfolio name and bio are required.')
      return
    }

    setLoading(true)

    try {
      const cid = await ipfsService.uploadJSON(metadata)
      const response = await portfolioApi.create(templateId, cid)
      addPortfolio(response.data)
      setCreatedCid(cid)
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

        <div className="field">
          <label htmlFor="templateId">Template ID</label>
          <input id="templateId" value={templateId} onChange={(event) => setTemplateId(event.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="name">Portfolio name</label>
          <input
            id="name"
            placeholder="Jane Doe — Product Engineer"
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            placeholder="Summarize the work this portfolio should prove."
            value={formData.bio}
            onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="skills">Skills</label>
          <input
            id="skills"
            placeholder="React, Stellar, TypeScript"
            value={formData.skills}
            onChange={(event) => setFormData({ ...formData, skills: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="links">Links</label>
          <input
            id="links"
            placeholder="https://github.com/example, https://portfolio.example"
            value={formData.links}
            onChange={(event) => setFormData({ ...formData, links: event.target.value })}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating portfolio…' : 'Create portfolio'}
        </Button>
      </form>
    </Card>
  )
}
