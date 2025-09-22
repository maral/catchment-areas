# Catchment areas

Transforming catchment area definitions of Czech cities from PDFs into geo data.

## Running the app

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Overview

The core idea of the project is automatically transforming Czech `ordinances` that specify `catchment areas` of schools into machine-readable geo data that could be shown on a map. This app is helping to transform ordinances of all Czech cities (with 2+ schools). There are two parts:

1. public map of catchment areas
2. administration of all founders and their ordinances

## Terminology

- **catchment area** (spádová oblast) - area defined currently by a set of address points and a primary school - whoever lives on the address has to be accepted for first grade of the primary school
- **ordinance** (vyhláška) - the legal document that a founder (city or a city district) has to publish in order to specify the catchment areas of its schools
- **street-markdown** - the intermediate format in natural language with given set of rules that is transformable into geodata

## Tech stack

This project follows up on the work on [text-to-map](https://github.com/maral/text-to-map) library. The library is used in this app, while staying separate - it's imported as an [NPM package](https://www.npmjs.com/package/text-to-map).

### text-to-map library

The library is written in TypeScript. It has the following components:

- **open-data sync** - downloads necessary data like address points, cities, regions, streets, schools and school founders and stores it all in a database
- **street-markdown parser** - the parser was created using [chevrotain](https://chevrotain.io/docs/) lexer/parser library

### Catchment areas app

The app is written in Next.js 15 using [React Server Components](https://nextjs.org/docs/getting-started/react-essentials).

#### Database

The app is deployed with MySQL, but PostgreSQL and SQLite are also implemented - thanks to [Knex.js](https://knexjs.org/), which is used as a query builder and for migrations (but migrations are implemented only on the text-to-map library side for now).

For DB API on both backend and frontend the app uses [Remult](https://remult.dev/). You can write simple queries on the frontend and Remult abstracts the function calls as a REST API.

#### Authentication

Microsoft login is the only provider for sign-in for editors and admins. It's called [Azure Active Directory](https://azure.microsoft.com/en-us/products/active-directory). Implemented using [NextAuth.js](https://next-auth.js.org/), which interacts also with the Remult API.

#### Frontend

Since it's a Next.js app, React is the render library. The app makes heavy use of the React Server Components - which lets you offload most of the async data operations to the server and on the client only a small JS is then needed. It's not particularly small yet, there is work to be done.

As a component library we use [shadcn/ui](https://ui.shadcn.com/) - a set of components built on top of [Radix UI](https://www.radix-ui.com/docs/primitives/overview/introduction) and [Tailwind CSS](https://tailwindcss.com/docs/installation).

The maps are created using [Leaflet](https://leafletjs.com/) and the code is ported from the [Prague's catchment areas web app](https://www.spadovostpraha.cz/) ([project's GitHub](https://github.com/maral/text-to-map-frontend)).

#### Street-markdown editor

The editor of the ordinances supports the street-markdown format - syntax highlighting, error messages with fixes suggestions and completion suggestions. The editor is made in [Monaco editor](https://microsoft.github.io/monaco-editor/), open-source export of the VS code engine. It's not well documented, but should be fairly simple to follow up on the already finished work.

#### Backend

On the backend, there is a bit of magic going on - first of all, ordinances in a single click from the [official registry](https://sbirkapp.gov.cz/vyhledavani). The app currently accepts PDF and DOC(x) formats - some ordinances are also in RTF format which is currently not implemented. The documents are converted to text (via text extraction or using the OCR library [Tesseract.js](https://github.com/naptha/tesseract.js)). When displayed in the editor for the first time, the text is preprocessed using ChatGPT. It extracts the school, street and municipality part names and puts them together into the street-markdown format.

#### Crons

There are several Cron jobs that are required for the app to work well: open-data sync (address points and streets are added every day), ordinances sync from the registry, possibly some others. These are not implemented yet - the scripts have to be run manually for now (see issues).
