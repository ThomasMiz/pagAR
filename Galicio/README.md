# Galicio: Setup

Galicio requires npm 9.8.0+ and node v16.17.0+ to run. You may download these from the following links:
* NodeJS: https://nodejs.org/en/download
* Or better, you may use nvm https://github.com/nvm-sh/nvm#installing-and-updating
* npm: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

Let's first set up the database. Install the npm package run-rs ([package](https://www.npmjs.com/package/run-rs?activeTab=readme)) ([github](https://github.com/vkarpov15/run-rs)):

```bash
npm install run-rs -g
```

Now `cd` into the directory where you'd like to store Galicio's database files, and start the database:
```bash
cd GalicioFiles
run-rs -v 4.0.0 --keep
```

The first time it will take longer, as `run-rs` needs to download MongoDB 4.0.0. Once done it will print to the screen a set of hostnames, which we'll need for a later step.

Onto galicio, `cd` into the directory where you downloaded the code for Galicio and install the npm dependencies:
```bash
cd Galicio
npm install
```

Now create a copy of the .env.sample file, call it .env, and fill it up like so:
```
SERVER_HOST=localhost:8080
DATABASE_HOSTS=MyComputer:27017,MyComputer:27018,MyComputer:27019
```

Make sure to set the `DATABASE_HOSTS` to the list outputted by the run-rs command we previously run!

To start the server, simply run:
```bash
npm start
```

The Swagger UI is now available at http://localhost:8080.
