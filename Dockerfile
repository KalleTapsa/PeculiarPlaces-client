# Stage 1 — build the React/Vite app
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Stage 2 — serve with nginx
FROM nginx:stable-alpine
RUN apk upgrade --no-cache && apk add --no-cache gettext

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# nginx config template — BACKEND_URL is substituted at container start
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# OpenShift / Rahti runs containers as a random non-root UID.
# Grant the group write access to the dirs nginx needs.
RUN chown -R nginx:0 /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && chmod -R g+rwX /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && sed -i 's|pid\s*/run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf

EXPOSE 8080
