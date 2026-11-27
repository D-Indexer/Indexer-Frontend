import { contractIdenticon, IDENTICON_GRID } from '@/services'

interface ContractIdenticonProps {
  contractId: string
  size?: number
}

/**
 * Offline identicon for a contract ID. Decorative: the contract ID is always shown as text next
 * to it, so the image is hidden from assistive technology.
 */
export const ContractIdenticon = ({ contractId, size = 40 }: ContractIdenticonProps) => {
  const { cells, hue } = contractIdenticon(contractId)
  const cell = size / IDENTICON_GRID
  return (
    <svg
      aria-hidden="true"
      className="contract-identicon"
      focusable="false"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      <rect fill={`hsl(${hue} 45% 96%)`} height={size} rx={4} width={size} />
      {cells.map((filled, index) =>
        filled ? (
          <rect
            fill={`hsl(${hue} 55% 42%)`}
            height={cell}
            key={index}
            width={cell}
            x={(index % IDENTICON_GRID) * cell}
            y={Math.floor(index / IDENTICON_GRID) * cell}
          />
        ) : null,
      )}
    </svg>
  )
}
