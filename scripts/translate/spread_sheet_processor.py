from oauth2client.service_account import ServiceAccountCredentials
import gspread
from os.path import normpath, join, dirname, abspath

class SpreadSheetProcessor(object):
  __KEY_FILE_NAME = normpath(join(dirname(abspath(__file__)), './quoridorn-translation-713e5256da7a.json'))
  __BOOK_KEY = "1VPyieLQLMjDL2HrVbdSsVZQjL59_fep-mP8EJZYyOPc"
  __SHEET_NAME = "translation"

  def __getTranslateWorkSheet(self):
    '''
    Googleスプレッドシートを取得する
    '''
    scope = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
    # ダウンロードしてきたjsonが秘密鍵
    credentials = ServiceAccountCredentials.from_json_keyfile_name(SpreadSheetProcessor.__KEY_FILE_NAME, scope)
    # OAuth2
    gc = gspread.authorize(credentials)

    # シート名を指定してシートを取得する
    workbook = gc.open_by_key(SpreadSheetProcessor.__BOOK_KEY)
    worksheet = workbook.worksheet(SpreadSheetProcessor.__SHEET_NAME)
    return worksheet

  def getWorkSheetLangInfo(self):
    worksheet = self.__getTranslateWorkSheet()

    property_col = 0
    ja_col = 0

    headers = worksheet.row_values(1)

    lang_info_list = []
    for i, header in enumerate(headers):
      if header == "property":
        property_col = i + 1
      elif header == "ja":
        ja_col = i + 1
      elif header != "":
        lang_info_list.append({ 'lang': header, 'col': i + 1 })

    lang_list = list(map(lambda l:l["lang"], lang_info_list))
    word_list = list(map(lambda l:worksheet.col_values(l["col"]), lang_info_list))

    if property_col == 0:
      raise Exception("プロパティ列が見つかりませんでした。")
    if ja_col == 0:
      raise Exception("日本語列が見つかりませんでした。")

    return (
      worksheet.col_values(property_col),
      worksheet.col_values(ja_col),
      dict(zip(lang_list, word_list))
    )
