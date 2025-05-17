# Base image
FROM node:18

# Metadata
LABEL maintainer="Gabriel Cantero"
LABEL description="CI/CD-ready Node.js microservice"

# Working directory
WORKDIR /app

# Dependency installation
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Set environment port
ENV PORT=3000
EXPOSE 3000

# Start app
CMD ["npm", "start"]
 
