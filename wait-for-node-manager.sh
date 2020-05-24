#!/bin/bash

set -e


host="$1"
shift
cmd="$@"

found=1

until [ $found = 2 ]; do
  if node -e "const axios = require('axios').default; axios.get('http://$host:3006/ping').then((resp) => {console.log(resp.data); process.exit(0); }).catch((error) => {process.exit(1) } );" ; then
    echo "Executed"
    found=2
  else
    echo "Can't connect, keep trying"
  fi
  sleep 2
done

>&2 echo "Pre-condition found, Running service"
exec $cmd
