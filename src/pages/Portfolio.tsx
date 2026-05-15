import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { portfolioAPI } from '@/services'
import type { Portfolio } from '@/types'

export const PortfolioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchPortfolio = async () => {
      try {
        const response = await portfolioAPI.get(id)
        setPortfolio(response.data)
      } catch (error) {
        console.error('Failed to fetch portfolio:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [id])

  if (loading) return <div>Loading portfolio...</div>
  if (!portfolio) return <div>Portfolio not found</div>

  return (
    <div className="portfolio-page">
      <h1>Portfolio</h1>
      <div className="portfolio-details">
        <p>Status: {portfolio.status}</p>
        <p>Created: {new Date(portfolio.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  )
}
