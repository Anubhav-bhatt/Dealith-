# All four runtime targets use immutable compiled artifacts and injected configuration.
FROM node:24.19.0-bookworm-slim AS tooling
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 COREPACK_HOME=/opt/corepack
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate && chmod -R a+rX /opt/corepack

FROM tooling AS build
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
# Packaging allowlists affect this build stage only, and exclude source/tests from deployed packages.
RUN node --input-type=module -e "import fs from 'node:fs'; for (const parent of ['apps','packages']) for (const name of fs.readdirSync(parent)) { const p=parent+'/'+name+'/package.json'; if(fs.existsSync(p)) { const v=JSON.parse(fs.readFileSync(p)); v.files=['dist','src/styles.css','src/tokens.css']; fs.writeFileSync(p,JSON.stringify(v)); } }"
RUN pnpm --filter @dealith/api deploy --prod --legacy /out/api && pnpm --filter @dealith/worker deploy --prod --legacy /out/worker

# One-shot migration tooling is deliberately isolated from API/worker runtime images.
FROM build AS migration
USER node
CMD ["pnpm", "db:migrate"]

FROM node:24.19.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
USER node

FROM runtime AS api
COPY --from=build --chown=node:node /out/api/ ./
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s CMD node -e "fetch('http://127.0.0.1:'+ (process.env.API_PORT || '4000') + '/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]

FROM runtime AS worker
COPY --from=build --chown=node:node /out/worker/ ./
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s CMD node -e "fetch('http://127.0.0.1:'+ (process.env.WORKER_PORT || '4001') + '/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]

FROM runtime AS web
COPY --from=build --chown=node:node /app/apps/web/.next/standalone/ ./
ENV PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

FROM runtime AS admin
COPY --from=build --chown=node:node /app/apps/admin/.next/standalone/ ./
ENV PORT=3001 HOSTNAME=0.0.0.0
EXPOSE 3001
CMD ["node", "apps/admin/server.js"]
