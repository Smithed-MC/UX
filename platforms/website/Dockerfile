FROM node:18.17.1-alpine

RUN apk update

WORKDIR /code

COPY ./apps ./apps
COPY ./packages ./packages
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
COPY ./turbo.json ./turbo.json

RUN npm i
RUN mkdir ./platforms
COPY ./platforms/website ./platforms/website

ARG VITE_NIGHTLY=false
RUN VITE_NIGHTLY=${VITE_NIGHTLY} npx turbo run build --filter=website

EXPOSE ${PORT}

CMD ["npm", "run", "web:serve"]