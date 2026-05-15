import React, { useEffect, useState } from 'react'
import { templateAPI } from '@/services'
import type { Template } from '@/types'

export const TemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await templateAPI.list()
        setTemplates(response.data)
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  if (loading) return <div>Loading templates...</div>

  return (
    <div className="template-list">
      {templates.map((template) => (
        <div key={template.id} className="template-card">
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          <p className="price">{template.price} XLM</p>
          <button>Use Template</button>
        </div>
      ))}
    </div>
  )
}
