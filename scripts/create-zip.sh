#!/bin/bash

# バージョン番号を指定してzipファイルを生成するスクリプト

# プロンプト入力
/bin/echo -n "VERSION_NUM?>"
read VERSION_NUM

# ファイル名
ZIP_NORMAL="quoridorn-$VERSION_NUM"
ZIP_GZ="quoridorn-$VERSION_NUM-gz"

# distフォルダ存在チェック
if [[ ! -d "dist" ]];
then
  echo "dist folder is not found."
  exit 1
fi

# フォルダコピー
copyTo() {
    # フォルダが既に存在する場合は削除
    if [[ -d $2 ]];
    then
      rm -rf $2
    fi

    # フォルダコピー
    cp -r $1 $2
}
copyTo dist "../$ZIP_NORMAL"
copyTo dist "../$ZIP_GZ"

# ファイルの削除
cd ../
find ./ -name '.DS_Store' -type f -ls -delete

# 個別削除
find "$ZIP_NORMAL" -name '*.gz' -type f -ls -delete
rm "$ZIP_NORMAL/chatLog.html"
rm "$ZIP_GZ/chatLog.html"
find "$ZIP_GZ/js" -name 'chatLog.*.js' -type f -ls -delete
find "$ZIP_GZ/js" -name 'chunk-vendors.*.js' -type f -ls -delete
find "$ZIP_GZ/js" -name 'index.*.js' -type f -ls -delete
find "$ZIP_GZ/static" -name 'jquery.js' -type f -ls -delete
find "$ZIP_GZ/static/icomoon/fonts" -name 'icomoon.eot' -type f -ls -delete
find "$ZIP_GZ/static/icomoon/fonts" -name 'icomoon.ttf' -type f -ls -delete
find "$ZIP_GZ/static/lib" -name 'dinamic-js-load.js' -type f -ls -delete
find "$ZIP_GZ/static/lib" -name 'YoutubeManager.js' -type f -ls -delete

# zip化
createZip() {
    # zipファイルが既に存在する場合は削除
    if [[ -f "$1.zip" ]];
    then
      rm -rf "$1.zip"
    fi

    # zip化
    zip -r "$1.zip" $1
}
createZip ${ZIP_NORMAL}
createZip ${ZIP_GZ}



