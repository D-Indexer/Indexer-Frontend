import React, { useState } from 'react'
import { Button, ErrorMessage, LoadingState } from '@/components/ui'
import { useContractTx } from '@/features/transactions'
import { apiClient, IpfsError, toApiError } from '@/services'
import { useWalletStore } from '@/store'
import type { TemplateMetadata } from '@/types'
import { parseDelimitedList } from '@/utils/validation'

interface RegisterTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const RegisterTemplateModal = ({ isOpen, onClose, onSuccess }: RegisterTemplateModalProps) => {
  const address = useWalletStore((state) => state.address)
  const { busy, error: txError, run, stage } = useContractTx()

  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [industry, setIndustry] = useState('')
  const [fields, setFields] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMsg(null)

    if (!address) {
      setFormError('Please connect your Freighter wallet to register a template.')
      return
    }

    const tId = parseInt(id, 10)
    if (isNaN(tId) || tId <= 0) {
      setFormError('Template ID must be a positive non-zero integer.')
      return
    }
    if (!name.trim()) {
      setFormError('Template name is required.')
      return
    }
    if (!description.trim()) {
      setFormError('Description is required.')
      return
    }
    if (!industry.trim()) {
      setFormError('Target industry is required.')
      return
    }
    const parsedFields = parseDelimitedList(fields)
    if (parsedFields.length === 0) {
      setFormError('Provide at least one field (comma-separated).')
      return
    }

    const metadata: TemplateMetadata = {
      schema_version: 1,
      template_id: tId,
      name: name.trim(),
      description: description.trim(),
      target_industry: industry.trim(),
      fields: parsedFields,
    }

    const result = await run(address, async (setUploading) => {
      setUploading()
      const jsonText = `${JSON.stringify(metadata, null, 2)}\n`
      const bytes = new TextEncoder().encode(jsonText)
      const form = new FormData()
      form.append('file', new Blob([bytes], { type: 'application/json' }), `${tId}.json`)

      let cid: string | undefined
      try {
        const response = await apiClient.post<{ cid?: string }>('/upload', form)
        cid = response.data.cid
      } catch (err) {
        throw new IpfsError(`Metadata upload failed: ${toApiError(err).message}`)
      }

      if (!cid) {
        throw new IpfsError('Backend upload did not return a valid CID.')
      }

      return {
        method: 'register_template',
        templateId: tId,
        metadataUri: `ipfs://${cid}`,
      }
    })

    if (result) {
      setSuccessMsg(`Template #${tId} registered on-chain successfully!`)
      onSuccess?.()
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="register-template-title">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100"
          aria-label="Close modal"
        >
          ✕
        </button>

        <h2 id="register-template-title" className="text-xl font-bold text-zinc-100 mb-4">
          Register New Template
        </h2>

        {successMsg ? (
          <div className="p-4 bg-green-950/60 border border-green-600 rounded-xl text-green-200 text-sm">
            {successMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="tpl-id" className="block text-xs font-medium text-zinc-300 mb-1">
                Template ID (number)
              </label>
              <input
                id="tpl-id"
                type="number"
                min="1"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="4"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="tpl-name" className="block text-xs font-medium text-zinc-300 mb-1">
                Template Name
              </label>
              <input
                id="tpl-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Executive"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="tpl-industry" className="block text-xs font-medium text-zinc-300 mb-1">
                Target Industry
              </label>
              <input
                id="tpl-industry"
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Management & Consulting"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="tpl-desc" className="block text-xs font-medium text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                id="tpl-desc"
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-impact layout highlighting leadership metrics and strategic achievements."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="tpl-fields" className="block text-xs font-medium text-zinc-300 mb-1">
                Fields (comma-separated)
              </label>
              <input
                id="tpl-fields"
                type="text"
                required
                value={fields}
                onChange={(e) => setFields(e.target.value)}
                placeholder="bio, leadership_roles, case_studies, board_memberships"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {formError ? <ErrorMessage message={formError} /> : null}
            {txError ? <ErrorMessage message={txError} /> : null}

            {busy ? (
              <LoadingState label={`Transaction status: ${stage}…`} />
            ) : (
              <div className="flex justify-end gap-3 mt-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  Register Template
                </Button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
