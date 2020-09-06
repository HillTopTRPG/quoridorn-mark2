# Quoridorn-mark2
Client of the Quoridorn.<br>
Quoridorn Ver.2.0.0以降のリポジトリです。<br>
開発を始めて約１年が経過し、行き当たりばったりのコーディングの積み重ねでソースが汚いので、オーバーホールも兼ねています。<br>

サーバ：quoridorn-server([GitHub](https://github.com/HillTopTRPG/quoridorn-server))

## Quoridornとは？
* [公式サイト](https://quoridorn.com)<br>
* 制作者：HillTop([Twitter](https://twitter.com/HillTop_TRPG))

## スペシャルサンクス
* **nekostore**
  * 制作者：https://github.com/esnya
  * Repository：<https://github.com/esnya/nekostore>

## 使い方
1. Quoridornクライアントのソースを用意
   1. `git clone https://github.com/HillTopTRPG/quoridorn-mark2.git` GitHubからソースをダウンロード
   1. `quoridorn-mark2/.env.example`ファイルを同じ場所に`.env`というファイル名で複製 (Ver.2.0.0a80～)
   1. `quoridorn-mark2/public/static/conf`フォルダの中のファイル名の末尾が`.example`となっている8つのファイルも上記と同様に、元のファイルと同じ場所に末尾の`.example`を除いたファイル名で複製 (Ver.2.0.0a80～)
   1. `cd quoridorn-mark2` 生成された「quoridorn-mark2」ディレクトリに移動
   1. `npm install` ライブラリをインストール

1. クライアントをビルドする
   1. `quoridorn-mark2/.env`を編集する（テキストエディタで編集可能）<br>
      ドメイン直下の設置フォルダ名を指定する<br>
      例1) http://hogehoge.com/quoridorn2/ に設置する場合<br>
      `VUE_APP_BASE_URL=quoridorn2`<br>
      とする<br>
      例2) http://hogehoge.com に設置する場合<br>
      `VUE_APP_BASE_URL=`<br>
      とする
   1. `npm run build` 成功すると「dist」フォルダが生成され、その中にWebサーバへの設置物が出来上がる

1. Quoridornクライアントの設定を編集
   1. `quoridorn-mark2/dist/static/conf/connect.yaml`を編集する（テキストエディタで編集可能）<br>
      書き方や注意点はyamlファイル内にコメントを書いてあるので、それを見ながら頑張って設定値を書いてください
   1. `quoridorn-mark2/dist/static/conf/termsOfUse.txt`を編集する（テキストエディタで編集可能）<br>
      クライアント側の利用規約の文章をここに書いてください

1. クライアント設置物をWebサーバに配置
   1. ビルドの工程で例1のパターンのとき<br>
      Webサーバ公開ディレクトリに`VUE_APP_BASE_URL`の値の名前のフォルダを作成する<br>
      このフォルダの中に`quoridorn-mark2/dist`フォルダの中身を全て配置する
   1. ビルドの工程で例2のパターンのとき<br>
      Webサーバ公開ディレクトリの直下に`quoridorn-mark2/dist`フォルダの中身を全て配置する

1. ブラウザからアクセスしてみる
   1. 良さげに表示されてたらOK
   1. もしうまくいかない場合はブラウザのキャッシュが効いている可能性があるので、キャッシュをクリアして再度アクセスしてみる(Google Chromeなら「Shift + F5」で可能)

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
