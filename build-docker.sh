#!/usr/bin/env bash

if [[ "$ARCH" != "arm" && "$ARCH" != "x86" ]] ; then
  echo 'Please set an ARCH to x86 or arm.'
  return
fi

if [[ -z "$ENV" ]] ; then
  echo 'Please set an ENV variable.'
  return
fi

DOCKERFILE="Dockerfile"
if [ "$ARCH" = "arm" ]; then
  DOCKERFILE="Dockerfile.armhf"
fi

docker build . -f $DOCKERFILE -t casanodeinternal/lnapi:$ARCH-$ENV
docker push casanodeinternal/lnapi:$ARCH-$ENV
