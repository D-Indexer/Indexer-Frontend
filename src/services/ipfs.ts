const IPFS_URL = import.meta.env.VITE_IPFS_API_URL || 'https://ipfs.io'

export const ipfsService = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${IPFS_URL}/api/v0/add`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    return data.Hash
  },

  uploadJSON: async (data: Record<string, unknown>): Promise<string> => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const file = new File([blob], 'metadata.json')
    return ipfsService.uploadFile(file)
  },

  getFile: (cid: string): string => {
    return `${IPFS_URL}/ipfs/${cid}`
  },
}
