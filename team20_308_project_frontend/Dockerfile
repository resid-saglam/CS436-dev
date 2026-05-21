### Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://api:5002/api
RUN npm run build          # dist klasörü oluşur

### Runtime
FROM nginx:1.26-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Use 127.0.0.1 explicitly — nginx in this image only listens on IPv4,
# and wget resolves "localhost" to ::1 first, which fails the healthcheck.
HEALTHCHECK CMD wget -qO- http://127.0.0.1 || exit 1
