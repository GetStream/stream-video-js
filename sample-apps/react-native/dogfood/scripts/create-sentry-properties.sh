#!/bin/bash

if [[ -z "$SENTRY_RN_AUTH_TOKEN" ]]; then
    echo "Must provide SENTRY_RN_AUTH_TOKEN in environment" 1>&2
    exit 1
fi

{
    echo 'defaults.url=https://sentry.io/'
    echo 'defaults.org=stream'
    echo 'defaults.project=video-dogfooding-react-native'
    echo 'auth.token='$SENTRY_RN_AUTH_TOKEN
    echo 'cli.executable=node_modules/@sentry/cli/bin/sentry-cli'
} > ./ios/sentry.properties

{
    echo 'defaults.url=https://sentry.io/'
    echo 'defaults.org=stream'
    echo 'defaults.project=video-dogfooding-react-native'
    echo 'auth.token='$SENTRY_RN_AUTH_TOKEN
} > ./android/sentry.properties
