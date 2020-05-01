# API connecting the Umbrel Dashboard to bitcoind & lnd

### How to use:

1. To `/home/umbrel/docker-compose.yml`, add the following service:
```
        middleware:
                image: getumbrel/middleware:latest
                depends_on: [ bitcoin, lnd ]
                logging: *default-logging
                restart: on-failure
                network_mode: host
                volumes:
                    - "/home/umbrel/lnd:/lnd"
                environment:
                    BITCOIN_HOST: "0.0.0.0"
                    RPC_PORT: "8332"
                    RPC_USER: "<your rpc username>"
                    RPC_PASSWORD: "<your rpc password>"
                    LND_NETWORK: "mainnet"
                    LND_HOST: "127.0.0.1"
```

2. Run `docker-compose up -d`

3. Test bitcoin from a computer connected to the same network
``` 
curl http://umbrel.local:3005/v1/bitcoind/info/status
```

4. Test lightning from a computer connected to the same network
```
curl http://umbrel.local:3005/v1/lnd/info/status
```