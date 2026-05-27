FROM node:26-slim AS builder

WORKDIR /app

# install pnpm globally
RUN npm install -g pnpm

# Copy your package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies strictly from the lockfile
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .

# Build the Mastra server and Studio UI
RUN pnpm build:studio

FROM node:26-slim AS runner

WORKDIR /app

# Copy only the self-contained output directory from the builder
COPY --from=builder /app/.mastra/output ./

EXPOSE 4111

# Tell Mastra to serve Studio from the built folder
ENV MASTRA_STUDIO_PATH=./studio
ENV NODE_ENV=development
ENV OUTPUT_ROOT=/data/output

# Start the server
CMD ["node", "index.mjs"]
