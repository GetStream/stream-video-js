FROM node:20-alpine as packager
WORKDIR /e2e

COPY sample-apps/ sample-apps/
RUN find sample-apps \! -name "package.json" -mindepth 3 -maxdepth 3 -print | xargs rm -rf

COPY packages/ packages/
RUN find packages \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf

FROM node:20-bullseye as runner
WORKDIR /e2e

COPY .yarn/ ./.yarn/
COPY yarn.lock package.json .yarnrc.yml tsconfig.json ./
COPY --from=packager /e2e/packages ./packages
COPY --from=packager /e2e/sample-apps ./sample-apps

RUN yarn install

RUN npx playwright install chromium
RUN npx playwright install-deps

# Copy all sources next
COPY ./packages ./packages
RUN yarn build:react:deps

COPY ./sample-apps/ ./sample-apps/
