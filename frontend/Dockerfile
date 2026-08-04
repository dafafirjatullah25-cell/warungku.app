# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.16.0

FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine AS final

COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]