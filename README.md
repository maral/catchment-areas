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
