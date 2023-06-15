#!/bin/bash

echo "Stream video buddy authenticating..."
stream-video-buddy auth

echo "Starting node server..."
node ./e2e/js/server.js &


echo "Running tests"
maestro test ./e2e/flow.yaml

echo "E2E tests completed successfully!"

echo "Killing node server..."
kill -9 "$(lsof -t -i tcp:7654)"

