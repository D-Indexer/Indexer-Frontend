export type TemplatePriceTier = 'free' | 'starter' | 'premium'

export const getTemplatePriceTier = (price: number): TemplatePriceTier => {
  if (price <= 0) {
    return 'free'
  }

  if (price <= 25) {
    return 'starter'
  }

  return 'premium'
}

export const getTemplatePriceTierLabel = (price: number) => {
  const tier = getTemplatePriceTier(price)
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}
