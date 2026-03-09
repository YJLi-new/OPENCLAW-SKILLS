FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY skills ./skills
COPY openclaw.plugin.json ./

EXPOSE 8787

CMD ["npm", "run", "dev"]

