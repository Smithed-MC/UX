FROM ubuntu:latest

RUN apt update
RUN apt -y upgrade

RUN apt install -y software-properties-common
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt update
RUN apt install -y python3-full python3-pip git curl

RUN pip install --break-system-packages smithed==0.15.9 rich 
RUN pip install --break-system-packages git+https://github.com/TheNuclearNexus/beet@e22a5156ac6d842c7197baa1445a02a6f30b7243

RUN mkdir /usr/local/nvm
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 18.17.1
RUN curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

ARG ARCH=64

RUN npm i -g turbo-linux-${ARCH} turbo
RUN npm i -g typescript

WORKDIR /code

COPY ./packages ./packages
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
COPY ./turbo.json ./turbo.json

RUN npm i

RUN mkdir ./platforms
COPY ./platforms/api ./platforms/api

EXPOSE ${PORT}

ENV ADMIN_CERT=./secret.json
ENV DOCKER = true
ENV REDIS = true

CMD ["npm", "run", "api:dev"]
