# Quoridorn-mark2
Client of the Quoridorn.<br>
Quoridorn Ver.2.0.0以降のリポジトリです。<br>
開発を始めて約１年が経過し、行き当たりばったりのコーディングの積み重ねでソースが汚いので、オーバーホールも兼ねています。<br>

サーバ：quoridorn-server([GitHub](https://github.com/HillTopTRPG/quoridorn-server))

## Quoridornとは？
* [公式サイト](http://quoridorn.com)<br>
* 制作者：HillTop([Twitter](https://twitter.com/HillTop_TRPG))

## スペシャルサンクス
* **nekostore**
  * 制作者：https://github.com/esnya
  * Repository：<https://github.com/esnya/nekostore>

## 使い方
1. Quoridornクライアントのソースを用意
   1. `https://github.com/HillTopTRPG/quoridorn-mark2.git` GitHubからソースをダウンロード
   1. `cd quoridorn-mark2` 生成された「quoridorn-mark2」ディレクトリに移動
   1. `npm install` ライブラリをインストール

1. クライアントをビルドする
   1. 「quoridorn-mark2/.env」を編集する（テキストエディタで編集可能）<br>
      ドメイン直下の設置パスを指定する
   1. `npm run build` 「dist」フォルダにWebサーバへの設置物を生成

1. Quoridornクライアントの設定を編集
   1. 「quoridorn-mark2/static/conf/connect.yaml」を編集する（テキストエディタで編集可能）<br>
      書き方や注意点はyamlファイル内にコメントを書いてあるので、それを見ながら頑張って設定値を書いて欲しい

1. クライアント設置物をWebサーバに配置
   1. 「.env」ファイルの編集で指定したディレクトリをWebサーバ公開ディレクトリに生成する
   1. 前項で生成したディレクトリ内に、ビルドして生成した設置物を配置

1. ブラウザからアクセスしてみる
   1. 良さげに表示されてたらOK
   1. もしうまくいかない場合はブラウザのキャッシュが効いている可能性があるので、キャッシュをクリアして再度アクセスしてみると良い

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
