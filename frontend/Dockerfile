FROM node:20-alpine

# 🔥 Move them HERE (After FROM)
ARG NEXT_PUBLIC_LIVE_STATUS_URL
ENV NEXT_PUBLIC_LIVE_STATUS_URL=$NEXT_PUBLIC_LIVE_STATUS_URL

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the code
COPY . .

# 🏗️ This is where Next.js "bakes" the URL into your JS files
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
