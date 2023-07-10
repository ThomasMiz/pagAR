# pagAR: Setup

pagAR depends on the [SantanderLago](./SantanderLago/README.md) and [Galicio](./Galicio/README.md) entities being already set up and running, so make sure to get those done first.

pagAR depends on NodeJS and npm, which you can see how to install on the Galicio setup.

We'll start by getting our database up and running. pagAR uses ScyllaDB, which you may easily run in a docker container:
```bash
docker pull scylladb/scylla
docker run  --name "my-scylla" -p 10000:10000 -p 7000:7000 -p 7001:7001 -p 9042:9042 -p 9160:9160 -p 9180:9180 -d scylladb/scylla
```

Once the container is running, `cd` into your pagAR/pagAR directory and create a copy of .env.sample, called .env, and fill it up like so:
```
SERVER_HOST=127.0.0.1:6969
DATABASE_HOSTS=localhost:9042
DATABASE_DATACENTER=datacenter1
DATABASE_KEYSPACE=pagar
```

If you have multiply ScyllaDB instances, you may specify them in `DATABASE_HOSTS` as multiple hostnames separated by commas, as shown in .env.sample.

Now install the required npm packages:
```bash
npm install
```

And run the pagAR server:
```bash
npm start
```

The Swagger UI is now available at http://localhost:6969.
