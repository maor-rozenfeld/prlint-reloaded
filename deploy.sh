#!/bin/bash

AWS_PROFILE=$1
REGION=$2

rm -f lambda.zip && zip -r lambda.zip . -x ".*" && aws lambda update-function-code --function-name prlintReloaded --profile $AWS_PROFILE --region $REGION --zip-file fileb://lambda.zip
