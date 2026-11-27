import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { FormField } from '@/components/forms'
import { Button, Card, ExternalLink, LoadingState, Markdown } from '@/components/ui'
import { TxStatus, useContractTx } from '@/features/transactions'
import { useWalletGuard } from '@/features/wallet'
import { useTemplates } from '@/hooks'
import { folderData, ipfsService } from '@/services'
import { computePortfolioCid } from '@/services/ipfs/ipfsService'
import type { Folder, Portfolio, PortfolioContent } from '@/types'
import { humanizeField } from '@/utils/format'
import { fromJsonResume, parseJsonResume, type JsonResumeMappedValues } from '../jsonResume'
import { getInvalidUrls, isRequired, parseDelimitedList } from '@/utils/validation'
import { diffPortfolioContent, type FieldChange } from '../utils/diffPortfolioContent'
import { DiffReview } from './DiffReview'

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
  const [publishedUpdatedAt, setPublishedUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!portfolio) return undefined
    let active = true
    setLoadingContent(true)
    // Remember the CID this edit is based on, to detect a concurrent update before signing.
    stellarService
      .getOnChainPortfolio(owner)
      .then((onChain) => onChain?.ipfsCid ?? portfolio.ipfsCid)
      .catch(() => portfolio.ipfsCid)
      .then((cid) => {
        if (active) setBaseCid(cid)
      })
    folderData
      .getPortfolioContent(portfolio.ipfsCid)
      .then((content) => {
        if (active) {
          setValues(fromContent(content, String(portfolio.templateId)))
          setPublishedUpdatedAt(content.updated_at)
        }
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
  }, [owner, portfolio])

  /** New documents use Markdown; an existing plain-text document stays plain so it renders as before. */
  const markdown = !published || published.content_format === 'markdown'
  const withPreview = (field: ReactNode, text: string, label: string) =>
    markdown ? (
      <div className="editor-split">
        {field}
        <aside className="editor-split__preview" aria-label={`Preview of ${label}`}>
          <p className="muted">Preview</p>
          <Markdown className="portfolio__prose" source={text} />
        </aside>
      </div>
    ) : (
      field
    )

  const selectedTemplate = templates.data?.find((template) => String(template.id) === values.templateId)
  const sectionFields = (selectedTemplate?.metadata?.fields ?? []).filter((field) => !CORE_FIELDS.has(field))

  const set = (key: Exclude<keyof FormValues, 'sections' | 'links'>) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }))

  const buildContent = (updatedAt: string): PortfolioContent => ({
    schema_version: 1,
    folder: folder.name,
    template_id: Number(values.templateId),
    name: values.name.trim(),
    headline: values.headline.trim(),
    bio: values.bio.trim(),
    skills: parseDelimitedList(values.skills),
    links: parseDelimitedList(values.links),
    sections: Object.fromEntries(
      sectionFields.map((field) => [field, (values.sections[field] ?? '').trim()]).filter(([, value]) => value),
    ),
    updated_at: updatedAt,
  })

  // Pristine relative to the published content: nothing to upload or pay for.
  const [pristine, setPristine] = useState(false)
  useEffect(() => {
    if (!isUpdate || publishedUpdatedAt === null) {
      setPristine(false)
      return undefined
    }
    let active = true
    void computePortfolioCid(buildContent(publishedUpdatedAt)).then((cid) => {
      if (active) setPristine(cid === portfolio.ipfsCid)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, publishedUpdatedAt, isUpdate, portfolio])

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
    // Reuse the published timestamp when nothing else changed, so identical content keeps its CID.
    const sameAsPublished = isUpdate && publishedUpdatedAt !== null && (await computePortfolioCid(buildContent(publishedUpdatedAt))) === portfolio.ipfsCid
    if (sameAsPublished) return
    const content = buildContent(new Date().toISOString())

    // Updates get a review step against the published version before anything is uploaded or signed.
    if (isUpdate && published) {
      setReview({ changes: diffPortfolioContent(published, content), content })
      return
    }
    await publish(content)
  }

  if (loadingContent) {
    return <LoadingState label="Loading your current portfolio content…" minHeight="24rem" />
  }

  /** Merging = re-basing on the newer version and reviewing my edits against it in the diff view. */
  const mergeWithNewer = async (newerCid: string) => {
    try {
      const newer = await folderData.getPortfolioContent(newerCid)
      setPublished(newer)
      setBaseCid(newerCid)
      if (review) setReview({ changes: diffPortfolioContent(newer, review.content), content: review.content })
      tx.reset()
    } catch (error) {
      setContentNotice(`The newer version could not be loaded from IPFS (${error instanceof Error ? error.message : 'unknown error'}).`)
    }
  }

  const conflictNotice = tx.conflict ? (
    <div className="notice notice--warning notice--stack" role="alert">
      <p>
        This portfolio was updated on-chain after you opened the editor (possibly from another device). Saving now would overwrite
        those changes.
      </p>
      <p>
        <ExternalLink className="mono" href={ipfsService.gatewayUrl(tx.conflict)}>View the newer version</ExternalLink>
      </p>
      <div>
        <Button type="button" onClick={() => void mergeWithNewer(tx.conflict as string)}>Merge: review my changes against it</Button>{' '}
        <Button
          type="button"
          variant="secondary"
          onClick={() => (review ? void publish(review.content, true) : tx.reset())}
        >
          Overwrite anyway
        </Button>
      </div>
    </div>
  ) : null

  if (review && !tx.busy && tx.stage !== 'done') {
    return (
      <Card>
        {conflictNotice}
        <DiffReview
          changes={review.changes}
          confirmLabel="Confirm and upload update"
          onBack={() => setReview(null)}
          onConfirm={() => void publish(review.content)}
        />
        <TxStatus {...tx} successMessage="" />
      </Card>
    )
  }

  return (
    <Card>
      <form className="form" onSubmit={(event) => void handleSubmit(event)} noValidate aria-labelledby="portfolio-form-title">
        <h2 id="portfolio-form-title" className="form__title">{isUpdate ? 'Update your portfolio' : 'Mint your portfolio'}</h2>
        {conflictNotice}
        {contentNotice ? (
          <div className="notice notice--warning" role="status" aria-atomic="true">
            <p>{contentNotice}</p>
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="portfolio-resume-import">Import JSON Resume</label>
          <input
            id="portfolio-resume-import"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleJsonResume(event)}
            aria-describedby="portfolio-resume-import-help"
          />
          <p className="field__help" id="portfolio-resume-import-help">
            Choose a local resume.json file. It is not uploaded until you confirm and publish.
          </p>
        </div>
        {importError ? <div className="notice notice--warning" role="alert"><p>{importError}</p></div> : null}
        {importPreview ? (
          <div className="notice" role="region" aria-label="JSON Resume import preview">
            <div>
              <strong>Preview mapped values</strong>
              <p>Name: {importPreview.name || '(empty)'}</p>
              <p>Headline: {importPreview.headline || '(empty)'}</p>
              <p>Bio: {importPreview.bio || '(empty)'}</p>
              <p>Skills: {importPreview.skills || '(empty)'}</p>
              <p>Links: {importPreview.links || '(empty)'}</p>
            </div>
            <div>
              <Button type="button" onClick={confirmImport}>Use imported values</Button>
              <Button type="button" variant="secondary" onClick={() => setImportPreview(null)}>Cancel</Button>
            </div>
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
              {sanitizeDisplayText(template.metadata?.name ?? `Template ${template.id}`, 120)} (#{template.id})
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
        {withPreview(
          <FormField
            control="textarea"
            id="portfolio-bio"
            label="Bio"
            required
            helpText={markdown ? 'Markdown: emphasis, lists, links, headings and code. HTML is not rendered.' : undefined}
            error={errors.bio}
            value={values.bio}
            onChange={set('bio')}
          />,
          values.bio,
          'Bio',
        )}
        <FormField id="portfolio-skills" label="Skills" helpText="Separate skills with commas." value={values.skills} onChange={set('skills')} />
        <LinksEditor
          id="portfolio-links"
          value={values.links}
          error={errors.links}
          onChange={(links) => setValues((current) => ({ ...current, links }))}
        />

        {sectionFields.map((field) => (
          <div key={field}>
            {withPreview(
              <FormField
                control="textarea"
                id={`portfolio-section-${field}`}
                label={humanizeField(field)}
                value={values.sections[field] ?? ''}
                rows={4}
                onChange={(event) => setValues((current) => ({ ...current, sections: { ...current.sections, [field]: event.target.value } }))}
              />,
              values.sections[field] ?? '',
              humanizeField(field),
            )}
          </div>
        ))}

        <TxStatus
          {...tx}
          successMessage={
            isUpdate
              ? 'Portfolio updated on-chain. The public page shows the new content once the indexer catches up.'
              : 'Portfolio minted on-chain. The public page is available once the indexer catches up.'
          }
        />
        {pristine ? (
          <p className="form__hint" role="status">
            No changes to publish.
          </p>
        ) : null}
        <Button type="submit" disabled={tx.busy || Boolean(blockedReason) || pristine}>
          {tx.busy ? 'Publishing…' : isUpdate ? 'Upload and update portfolio' : 'Upload and mint portfolio'}
        </Button>
      </form>
    </Card>
  )
}
