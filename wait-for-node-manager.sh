#!/usr/bin/env node

const pingurl = process.env.PINGURL || "http://localhost:3006/ping";

const axios = require('axios').default;
axios.get(pingurl).then(
    (resp) => {
        console.log(resp.data);
        process.exit(0);
    }).catch(
        (error) => {
            if (error.response != undefined || error.response != null ) {
                console.log(error.response.status);
            } else {
                console.log("Error connecting to: " + pingurl);
            }
            process.exit(1)
        }
    );

