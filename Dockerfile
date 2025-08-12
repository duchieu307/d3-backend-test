FROM node:20-alpine as builder

WORKDIR /eth-balance-backend
RUN chown -R node:node /eth-balance-backend

RUN apk add --update --no-cache \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake

COPY package.json ./

RUN yarn
COPY . .
RUN yarn build

FROM node:20-alpine as prod

WORKDIR /eth-balance-backend

COPY --from=builder /eth-balance-backend ./
CMD ["node", "dist/main.js"]