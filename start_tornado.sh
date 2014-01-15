#!/bin/sh

PATH="./"

PORT="9987"

echo "server listening on port $PORT"
./static_server.py $PATH $PORT
