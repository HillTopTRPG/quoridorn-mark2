import requests
from requests.auth import HTTPBasicAuth
from spread_sheet_processor import SpreadSheetProcessor

from os.path import normpath, join, dirname, abspath
from os import environ
from dotenv import load_dotenv

class TranslateProcessorIbm(object):
  __ENV_FILE_NAME = normpath(join(dirname(abspath(__file__)), './ibm-credentials.env'))

  def __init__(self):
    pass

  def translate(self, text_list, model_id):
    '''
    IBMのAPIを使ってテキストを翻訳する
    @param env_path IBMのAPIの認証情報が記載されたenvファイルへの参照パス
    @param text_list 翻訳対象のテキストが格納された配列
    @param model_id 翻訳言語モデル(IBMのAPIの仕様に沿った値)
    @return { list: 翻訳結果の配列, dict: 翻訳前後のテキストをキーと値とした辞書 }
    '''
    # 環境変数に取り込む
    load_dotenv(TranslateProcessorIbm.__ENV_FILE_NAME)

    apiKey = environ["LANGUAGE_TRANSLATOR_APIKEY"]
    apiUrl = environ["LANGUAGE_TRANSLATOR_URL"]

    response = requests.post(
      apiUrl + "/v3/translate?version=2018-05-01",
      timeout=10,
      headers={
        "Content-Type": "application/json"
      },
      json={
        "text": text_list,
        "model_id": model_id
      },
      auth=HTTPBasicAuth("apikey", apiKey)
    )

    # 翻訳済みリスト
    translation_list = list(map(lambda t:t["translation"].replace(" \\\\n ", "\\n"), response.json()["translations"]))

    # 翻訳前のリストと翻訳済みのリストの２つから辞書を作って返却
    translation_dict = dict(zip(text_list, translation_list))
    return {
      "list": translation_list,
      "dict": translation_dict
    }
