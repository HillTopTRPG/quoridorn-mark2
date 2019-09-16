#/bin/bash

# 環境変数 QUORIDORN_SKYWAY_KEY を使用してSkyWayのAPIキーを設定するスクリプト

CONNECT_YAML="dist/static/conf/connect.yaml"

if [ ! -f $CONNECT_YAML ]
then
  echo "Connection settings file is not found."
  exit 1
fi

if [ -z $QUORIDORN_SKYWAY_KEY ]
then
  echo "Environment variable QUORIDORN_SKYWAY_KEY is not set."
  exit 1
fi

sed -E -i '.old' "s/^(skywayKey:).+/\1 \"$QUORIDORN_SKYWAY_KEY\"/" $CONNECT_YAML
echo "Set SkyWay API key to \"$QUORIDORN_SKYWAY_KEY\""
