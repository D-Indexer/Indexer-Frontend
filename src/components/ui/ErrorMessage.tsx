interface ErrorMessageProps {
  code?: string
  detail?: string
  docsUrl?: string
  message: string
}

export const ErrorMessage = ({ code, detail, docsUrl, message }: ErrorMessageProps) => {
  const resolvedDocsUrl = docsUrl ?? (code ? `/docs/errors.md#${code.toLowerCase()}` : undefined)

  return (
    <div className="error-message" role="alert" aria-atomic="true">
      <p>{message}</p>
      {detail ? <p className="error-message__detail">{detail}</p> : null}
      {resolvedDocsUrl ? (
        <p className="error-message__docs">
          <a
            className="error-message__link underline text-sm"
            href={resolvedDocsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Learn more about {code ?? 'this error'} →
          </a>
        </p>
      ) : null}
    </div>
  )
}
