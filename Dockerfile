FROM node:18-alpine

WORKDIR /app

# Copy only package files first (cache)
COPY package*.json ./

# Install deps (cached layer)
RUN npm install --omit=dev

# Copy only required folders
COPY backend ./backend
COPY models ./models
COPY config ./config

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "server.js"]