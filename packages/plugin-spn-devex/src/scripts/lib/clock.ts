/**
 * An instant as a report stamps it: the local date and time with the zone's offset,
 * `2026-09-29T14:32+05:30`, never a bare UTC `Z`. `toISOString` is UTC, which reads as a different
 * day on a machine east of Greenwich, so a person would compare two stamps that disagree.
 */
export const withOffset = (at: Date): string => {
  const pad = (n: number): string => String(Math.abs(n)).padStart(2, "0");
  const minutes = -at.getTimezoneOffset();
  const sign = minutes < 0 ? "-" : "+";
  const offset = `${sign}${pad(Math.trunc(minutes / 60))}:${pad(minutes % 60)}`;
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}` +
    `T${pad(at.getHours())}:${pad(at.getMinutes())}${offset}`;
};
