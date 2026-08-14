interface ErrorMessageProps {
  message: string
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <div className="error-message" role="alert">
      {message}
    </div>
  )
}
