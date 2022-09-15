# syntax=docker/dockerfile:1

FROM node:18-alpine
WORKDIR uwubot
COPY ./package.json ./package-lock.json ./tsconfig.json ./
RUN npm ci
COPY ./src ./src
RUN npm run build
CMD [ "npm", "start" ]
