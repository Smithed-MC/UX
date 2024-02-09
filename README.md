# UX

[![Discord](https://img.shields.io/discord/511303648119226382?color=%236d82cc&label=Discord&logo=discord&logoColor=white)](https://discord.gg/gkp6UqEUph)

> This repository contains the code for the Smithed website and launcher, as well as our backend code

If you are looking for the Docker configuration that runs the backend, go [here](https://github.com/Smithed-MC/Dockers)

## Downloading

The latest stable version of the launcher can be downloaded from the [website](https://smithed.net/)

## Building

### Prerequisites

-   [Node.js - v18+](https://nodejs.org/en)
-   [Rust / Tauri](https://tauri.app/v1/guides/getting-started/prerequisites) (Only required for building the launcher)

### Setting up the monorepo

1. Clone the repo

```sh
git clone https://github.com/Smithed-MC/UX
```

2. Go into the directory and install dependencies

```sh
cd ./UX
npm i
```

### Developing the website

```
npm run web:dev
```

This will open a local development server with live reload.

> [!TIP]
> In order to launch a server you must provide `PORT`, `VITE_NIGHTLY` & `VITE_API_SERVER` environment variables.
>
> **Example**:
> `VITE_NIGHTLY=true VITE_API_SERVER=https://api.smithed.dev/v2 PORT=8000 npm run web:dev`

### Developing the API

In order to test, you'll need to create your own [firebase database and secret](https://firebase.google.com/docs/admin/setup).
Afterwards, navigate to UX/platforms/api and create a `.env` file and put your secret into a `secret.json` file
Inside the `.env` file:

```
CERT=./secret.json
PORT=8000
```

Then from the root `UX` folder, you should be able to start the API like so

```
npm run api:dev
```
