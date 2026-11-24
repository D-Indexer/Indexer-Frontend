import { useEffect, useState, type FormEvent } from 'react'
import { FormField } from '@/components/forms'
import { Button, Card, LoadingState } from '@/components/ui'
import { TxStatus, useContractTx } from '@/features/transactions'
import { useWalletGuard } from '@/features/wallet'
import { useTemplates } from '@/hooks'
import { folderData, ipfsService } from '@/services'
import type { Folder, Portfolio, PortfolioContent, PortfolioLink } from '@/types'
import { humanizeField } from '@/utils/format'
import { getPortfolioLinks, getPortfolioLinkError, serializePortfolioLinks } from '@/utils/portfolioLinks'
import { isRequired, parseDelimitedList } from '@/utils/validation'
import { LinksEditor } from './LinksEditor'

/** Fields every template shares; template-specific fields become free-text sections. */
const CORE_FIELDS = new Set(['bio', 'skills'])

interface FormValues {
  bio: string
  headline: string
  links: PortfolioLink[]
  name: string
  sections: Record<string, string>
  skills: string
  templateId: string
}

type FormErrors = Partial<Record<'name' | 'bio' | 'links' | 'templateId', string>>

const emptyValues = (templateId: string): FormValues => ({
  bio: '',
  headline: '',
  links: [],
  name: '',
  sections: {},
  skills: '',
  templateId,
})

const fromContent = (content: PortfolioContent, templateId: string): FormValues => ({
  bio: content.bio ?? '',
  headline: content.headline ?? '',
  links: getPortfolioLinks(content),
  name: content.name ?? '',
  sections: content.sections ?? {},
  skills: (content.skills ?? []).join(', '),
  templateId,
})

const validate = (values: FormValues): FormErrors => {
  const errors: FormErrors = {}
  if (!values.templateId) errors.templateId = 'Choose a template.'
  if (!isRequired(values.name)) errors.name = 'Enter the name to show on your portfolio.'
  if (!isRequired(values.bio)) errors.bio = 'Write a short bio.'
  if (values.links.some((link) => getPortfolioLinkError(link))) errors.links = 'Fix the highlighted links before publishing.'
  return errors
}

const fieldOrder: Array<keyof FormErrors> = ['templateId', 'name', 'bio', 'links']

interface PortfolioFormProps {
  folder: Folder
  initialTemplateId?: string | null
  onPublished: (hash: string) => void
  owner: string
  portfolio: Portfolio | null
}

/**
 * Writes portfolio content, uploads it through the backend, and anchors the CID on-chain with
 * `mint_portfolio` (first time) or `update_portfolio` (afterwards).
 */
export const PortfolioForm = ({ folder, initialTemplateId, onPublished, owner, portfolio }: PortfolioFormProps) => {
  const isUpdate = portfolio !== null
  const templates = useTemplates()
  const tx = useContractTx()
  const { blockedReason } = useWalletGuard()
  const startTemplate = String(portfolio?.templateId ?? folder.templateId ?? initialTemplateId ?? '')
  const [values, setValues] = useState<FormValues>(() => emptyValues(startTemplate))
  const [errors, setErrors] = useState<FormErrors>({})
  const [contentNotice, setContentNotice] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(isUpdate)

  useEffect(() => {
    if (!portfolio) return undefined
    let active = true
    setLoadingContent(true)
    folderData
      .getPortfolioContent(portfolio.ipfsCid)
      .then((content) => {
        if (active) setValues(fromContent(content, String(portfolio.templateId)))
      })
      .catch((error: unknown) => {
        if (active)
          setContentNotice(
            `Your current content could not be loaded from IPFS (${error instanceof Error ? error.message : 'unknown error'}). Publishing will replace it with what you enter here.`,
          )
      })
      .finally(() => {
        if (active) setLoadingContent(false)
      })
    return () => {
      active = false
    }
  }, [portfolio])

  const selectedTemplate = templates.data?.find((template) => String(template.id) === values.templateId)
  const sectionFields = (selectedTemplate?.metadata?.fields ?? []).filter((field) => !CORE_FIELDS.has(field))

  const set = (key: Exclude<keyof FormValues, 'sections' | 'links'>) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    const firstInvalid = fieldOrder.find((key) => nextErrors[key])
    if (firstInvalid) {
      const firstInvalidLink = values.links.findIndex((link) => getPortfolioLinkError(link))
      const targetId = firstInvalid === 'links' ? `portfolio-links-${firstInvalidLink}-url` : `portfolio-${firstInvalid}`
      document.getElementById(targetId)?.focus()
      return
    }

    const templateId = Number(values.templateId)
    const serializedLinks = serializePortfolioLinks(values.links)
    const content: PortfolioContent = {
      schema_version: 1,
      folder: folder.name,
      template_id: templateId,
      name: values.name.trim(),
      headline: values.headline.trim(),
      bio: values.bio.trim(),
      skills: parseDelimitedList(values.skills),
      links: serializedLinks.map((link) => link.url),
      link_meta: serializedLinks,
      sections: Object.fromEntries(
        sectionFields.map((field) => [field, (values.sections[field] ?? '').trim()]).filter(([, value]) => value),
      ),
      updated_at: new Date().toISOString(),
    }

    const result = await tx.run(owner, async (setUploading) => {
      setUploading()
      const ipfsCid = await ipfsService.uploadPortfolioContent(content)
      return isUpdate ? { method: 'update_portfolio', ipfsCid } : { method: 'mint_portfolio', templateId, ipfsCid }
    })
    if (result) onPublished(result.hash)
  }

  if (loadingContent) {
    return <LoadingState label="Loading your current portfolio content…" minHeight="24rem" />
  }

  return (
    <Card>
      <form className="form" onSubmit={(event) => void handleSubmit(event)} noValidate aria-labelledby="portfolio-form-title">
        <h2 id="portfolio-form-title" className="form__title">{isUpdate ? 'Update your portfolio' : 'Mint your portfolio'}</h2>
        {contentNotice ? (
          <div className="notice notice--warning" role="status">
            <p>{contentNotice}</p>
          </div>
        ) : null}

        <FormField
          control="select"
          id="portfolio-templateId"
          label="Template"
          required
          error={errors.templateId ?? (templates.error ? `Templates could not be loaded: ${templates.error.message}` : undefined)}
          helpText={
            isUpdate
              ? 'The template is fixed after minting; update_portfolio only changes the content.'
              : 'Registered templates from the Folder contract.'
          }
          value={values.templateId}
          disabled={isUpdate || templates.loading}
          onChange={set('templateId')}
        >
          <option value="">{templates.loading ? 'Loading templates…' : 'Choose a template'}</option>
          {(templates.data ?? []).map((template) => (
            <option key={template.id} value={template.id}>
              {template.metadata?.name ?? `Template ${template.id}`} (#{template.id})
            </option>
          ))}
        </FormField>

        <FormField id="portfolio-name" label="Name" required error={errors.name} value={values.name} onChange={set('name')} autoComplete="name" />
        <FormField
          id="portfolio-headline"
          label="Headline"
          helpText="One line, e.g. “Product engineer, Lagos”."
          value={values.headline}
          onChange={set('headline')}
        />
        <FormField control="textarea" id="portfolio-bio" label="Bio" required error={errors.bio} value={values.bio} onChange={set('bio')} />
        <FormField id="portfolio-skills" label="Skills" helpText="Separate skills with commas." value={values.skills} onChange={set('skills')} />
        <LinksEditor
          id="portfolio-links"
          value={values.links}
          error={errors.links}
          onChange={(links) => setValues((current) => ({ ...current, links }))}
        />

        {sectionFields.map((field) => (
          <FormField
            key={field}
            control="textarea"
            id={`portfolio-section-${field}`}
            label={humanizeField(field)}
            value={values.sections[field] ?? ''}
            rows={4}
            onChange={(event) => setValues((current) => ({ ...current, sections: { ...current.sections, [field]: event.target.value } }))}
          />
        ))}

        <TxStatus
          {...tx}
          successMessage={
            isUpdate
              ? 'Portfolio updated on-chain. The public page shows the new content once the indexer catches up.'
              : 'Portfolio minted on-chain. The public page is available once the indexer catches up.'
          }
        />
        <Button type="submit" disabled={tx.busy || Boolean(blockedReason)}>
          {tx.busy ? 'Publishing…' : isUpdate ? 'Upload and update portfolio' : 'Upload and mint portfolio'}
        </Button>
      </form>
    </Card>
  )
}
