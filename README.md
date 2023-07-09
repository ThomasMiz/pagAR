# pagAR
Simulated platform for digital payments

# Requirements for Galicio
Galicio uses a MongoDB runner for ACID transactions. 

>> npm install run-rs -g
>> run-rs -v 4.0.0 --keep

This will automatically start a replica set.

Run-rs clears the database every time it starts by default. To override this behavior, use the --keep flag.