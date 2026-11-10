interface ErrorMessageProps {
  detail?: string
  message: string
}

export const ErrorMessage = ({ detail, message }: ErrorMessageProps) => {
  return (
    <div className="error-message" role="alert">
      <p>{message}</p>
      {detail ? <p className="error-message__detail">{detail}</p> : null}
    </div>
  )
}
