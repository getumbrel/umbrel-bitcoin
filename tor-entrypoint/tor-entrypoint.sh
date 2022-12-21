#!/bin/bash
TORRC_PATH="/etc/tor/torrc"
PLAIN_TEXT_PASSWORD="umbrelisneat"
HASH_PASSWORD=`tor --hash-password "$PLAIN_TEXT_PASSWORD"`
# clobber old file
echo "SocksPort 0.0.0.0:9050" > "${TORRC_PATH}"
echo "ControlPort 0.0.0.0:9051" >> "${TORRC_PATH}"
echo "CookieAuthentication 1" >> "${TORRC_PATH}"
echo "CookieAuthFileGroupReadable 1" >> "${TORRC_PATH}"
echo "HashedControlPassword $HASH_PASSWORD" >> "${TORRC_PATH}"
tor -f "${TORRC_PATH}"