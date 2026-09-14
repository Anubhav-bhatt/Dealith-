import { z } from 'zod';
export const opaqueId = z.uuid();
export const utcInstant = z.iso.datetime({ offset: true });
export const decimalString = z.string().regex(/^(0|[1-9][0-9]*)(\.[0-9]+)?$/);
export const emailAddress = z.email().max(254);
export const httpUrl = z.url().refine((value) => {
  const url = URL.parse(value);
  return !!url && ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
});
export const safeString = z
  .string()
  .trim()
  .max(1000)
  .refine((value) =>
    Array.from(value).every(
      (char) => char.charCodeAt(0) >= 32 || [9, 10, 13].includes(char.charCodeAt(0)),
    ),
  );
// Shape validation only; supported settlement currencies are determined by later provider policy.
export const currencyCode = z.string().regex(/^[A-Z]{3}$/);
export const pagination = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: opaqueId.optional(),
  })
  .strict();
