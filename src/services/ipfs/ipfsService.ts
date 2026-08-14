import { env } from '@/config/env'

export const ipfsService = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${env.ipfsApiUrl}/api/v0/add`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`IPFS upload failed with status ${response.status}`)
    }

    const data = (await response.json()) as { Hash?: string }
    if (!data.Hash) {
      throw new Error('IPFS upload response did not include a CID')
    }

    return data.Hash
  },

  uploadJSON: async (data: unknown): Promise<string> => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const file = new File([blob], 'metadata.json')
    return ipfsService.uploadFile(file)
  },

  getFileUrl: (cid: string): string => `${env.ipfsApiUrl}/ipfs/${cid}`,
}
