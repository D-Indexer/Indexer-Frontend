import React, { useState } from 'react'
import { portfolioAPI, ipfsService } from '@/services'
import { usePortfolioStore } from '@/store'

interface PortfolioEditorProps {
  templateId: string
}

export const PortfolioEditor: React.FC<PortfolioEditorProps> = ({ templateId }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    links: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const { addPortfolio } = usePortfolioStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cid = await ipfsService.uploadJSON(formData)
      const response = await portfolioAPI.create(templateId, cid)
      addPortfolio(response.data)
    } catch (error) {
      console.error('Failed to create portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="portfolio-editor">
      <input
        type="text"
        placeholder="Portfolio Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <textarea
        placeholder="Bio"
        value={formData.bio}
        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Portfolio'}
      </button>
    </form>
  )
}
