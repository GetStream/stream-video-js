FROM node:20-bullseye

WORKDIR /e2e

COPY ./ ./

RUN ls && yarn install --inline-builds

RUN yarn build:react:deps

RUN npx playwright install chromium

RUN npx playwright install-deps
