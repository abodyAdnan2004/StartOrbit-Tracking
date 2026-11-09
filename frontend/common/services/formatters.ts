export function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Baghdad',
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'Asia/Baghdad',
  }
  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date)
  const formattedTime = new Intl.DateTimeFormat('ar-EG', timeOptions).format(date)
  return `${formattedDate} ${formattedTime}`
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Baghdad',
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date)
  return `${formattedDate}`
}
