// This entry point deliberately does not import process or the server schema.
export const publicConfig = Object.freeze({
  productName: 'Dealith',
  tagline: 'Discover. Verify. Negotiate. Acquire.',
  capabilities: Object.freeze({ registration: false, settlement: false, crypto: false }),
});
