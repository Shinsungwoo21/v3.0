FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for some node modules
RUN apk add --no-cache libc6-compat

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

CMD ["npm", "run", "dev"]
