export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const FORMAT_TOKENS: Record<string, Intl.DateTimeFormatOptions> = {
  YYYY: { year: 'numeric' },
  MM: { month: '2-digit' },
  DD: { day: '2-digit' },
  HH: { hour: '2-digit', hour12: false },
  mm: { minute: '2-digit' },
  ss: { second: '2-digit' },
};

export function formatDateBy(dateStr: string, format: string) {
  const date = new Date(dateStr);
  let result = format;
  for (const [token, opts] of Object.entries(FORMAT_TOKENS)) {
    if (result.includes(token)) {
      const value = new Intl.DateTimeFormat('ko-KR', opts).format(date);
      result = result.replace(token, value);
    }
  }
  return result;
}
