/**
 * Format a date using token placeholders: Y+, M+ (month), d+, H+, m+ (minutes), s+.
 * Two-or-more character tokens are zero-padded; single-character tokens are not.
 */
export function formatTime(
  time: Date | string | number | undefined,
  format = "MM/dd HH:mm",
): string {
  const date = time
    ? typeof time === "object"
      ? time
      : new Date(time)
    : new Date();

  const parts: Record<string, number> = {
    "Y+": date.getFullYear(),
    "M+": date.getMonth() + 1,
    "m+": date.getMinutes(),
    "d+": date.getDate(),
    "H+": date.getHours(),
    "s+": date.getSeconds(),
  };

  const yearMatch = /(Y+)/.exec(format);
  if (yearMatch) {
    const y = String(date.getFullYear());
    format = format.replace(yearMatch[0], y.slice(4 - yearMatch[1].length));
  }

  for (const key of Object.keys(parts)) {
    const re = new RegExp(`(${key})`);
    if (!re.test(format)) continue;
    const match = RegExp.$1;
    const raw = parts[key];
    const segment =
      match.length >= 2 && raw < 10 ? `0${raw}` : String(raw);
    format = format.replace(match, segment);
  }

  return format;
}

export function formatTxid(
  txid: string | undefined,
  edgeLength = 4,
): string | undefined {
  if (!txid) {
    return txid;
  }
  return `${txid.slice(0, edgeLength)}...${txid.slice(-edgeLength)}`;
}

export function openArweaveTransactionOnViewBlock(txid: string | undefined): void {
  if (!txid) {
    return;
  }
  window.open(`https://viewblock.io/arweave/tx/${txid}`, "_blank");
}

/** @deprecated Use {@link openArweaveTransactionOnViewBlock} for clarity. */
export const jumpToTxidDetail = openArweaveTransactionOnViewBlock;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
