export function formatDateTime(dateString: string | Date) {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
