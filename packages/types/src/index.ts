export type AppEnvironment =
  'local' | 'test' | 'dev' | 'preview' | 'staging' | 'pre-production' | 'production';
export type ServiceName = 'api' | 'worker';
export type Identifier<Kind extends string> = string & { readonly __kind: Kind };
export type CursorPage<T> = { items: readonly T[]; nextCursor: string | null };
