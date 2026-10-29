FROM node:20-alpine AS builder

WORKDIR /app

# Copy all files from build context
COPY . .

# If built from repository root (where frontend/ directory exists), move files into working directory
RUN if [ -d "frontend" ]; then \
      cp -r frontend/* . 2>/dev/null || true; \
      cp frontend/package*.json . 2>/dev/null || true; \
    fi && \
    npm install && \
    npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000

CMD ["npm", "start"]
