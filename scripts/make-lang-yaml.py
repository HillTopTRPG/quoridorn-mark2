from ruamel.yaml import YAML, add_constructor, resolver, RoundTripRepresenter, round_trip_dump, scalarstring, comments
from oauth2client.service_account import ServiceAccountCredentials
import configparser
import gspread
import json
import re

#--------- YAMLパーサーの設定
def represent_str(dumper, instance):
  instance = instance.replace("\\n", "\n")
  if "\n" in instance:
    return dumper.represent_scalar(
      'tag:yaml.org,2002:str',
      instance,
      style='|'
    )
  else:
    return dumper.represent_scalar(
      'tag:yaml.org,2002:str',
      instance
    )

# テキストの改行をブロックスタイルにする
RoundTripRepresenter.add_representer(str, represent_str)

# 入力時に順序を保持する
add_constructor(resolver.BaseResolver.DEFAULT_MAPPING_TAG,
    lambda loader, node: OrderedDict(loader.construct_pairs(node)))

yaml = YAML()

def getWorkSheet(spreadsheet_key, sheet_name):
  '''
  Googleスプレッドシートを取得する
  '''
  scope = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
  # ダウンロードしてきたjsonが秘密鍵
  credentials = ServiceAccountCredentials.from_json_keyfile_name('scripts/quoridorn-translation-713e5256da7a.json', scope)
  # OAuth2
  gc = gspread.authorize(credentials)

  # シート名を指定してシートを取得する
  workbook = gc.open_by_key(spreadsheet_key)
  worksheet = workbook.worksheet(sheet_name)
  return worksheet

def add_property(config, section, data, label_history):
  for key in data.keys():
    value = data[key]
    key = str(key)
    label = label_history + "." + key if label_history else key

    v_type = type(value)
    if v_type is str or v_type is int or v_type is scalarstring.LiteralScalarString or v_type is comments.CommentedSeq:
      value = str(value)
      value = value.replace('%', '%%')
      value = value.replace("'", '"')
      if v_type is comments.CommentedSeq:
        v_l_l = json.loads(value)
        for i, v_l in enumerate(v_l_l):
          label1 = label + '.' + str(i)
          for j, v in enumerate(v_l):
            label2 = label1 + '.' + str(j)
            config.set(section, label2, v)
      else:
        config.set(section, label, value)
    else:
      add_property(config, section, value, label)

def proc_word_list(lang, raw_property_info_list, property_list, word_list, ja_list):
  print("--", lang)
  output = {}
  for raw_property in raw_property_info_list:
    index = raw_property["index"]
    property = property_list[index]
    word = word_list[index] if index < len(word_list) else ja_list[index]

    op_list = property.split(".")

    current = output
    last_prop = None
    parent = None
    for i, op in enumerate(op_list):
      if i == len(op_list) - 1:
        if op.isdigit():
          current.append(word)
        else:
          current[op] = word
      else:
        if op.isdigit():
          op = int(op)
        try:
          current[op]
        except Exception as e:
          if type(op) is int:
            parent[last_prop] = []
            current = parent[last_prop]
            parent[last_prop].append([])
          else:
            current[op] = {}
        parent = current
        last_prop = op
        current = current[op]
  with open('public/static/lang/{}.yaml'.format(lang), encoding='utf-8', mode='w') as file:
    out = round_trip_dump(output, explicit_start=False)
    out = re.sub(r'^([^ ])', r'\n\1', out, flags=re.MULTILINE)
    round_trip_dump(yaml.load(out), file, explicit_start=False)


def main():
  property_col = 0
  ja_col = 0

  lang_info_list = []
  worksheet = getWorkSheet("1VPyieLQLMjDL2HrVbdSsVZQjL59_fep-mP8EJZYyOPc", "translation")
  headers = worksheet.row_values(1)
  for i, header in enumerate(headers):
    if header == "property":
      property_col = i + 1
    elif header == "ja":
      ja_col = i + 1
    elif header != "":
      lang_info_list.append({ 'lang': header, 'col': i + 1 })

  if property_col == 0:
    print("プロパティ列が見つかりませんでした。")
    exit
  if ja_col == 0:
    print("日本語列が見つかりませんでした。")
    exit

  property_list = worksheet.col_values(property_col)
  ja_list = worksheet.col_values(ja_col)

  raw_property_info_list = []

  def getPropInfo(prop):
    for i, p in enumerate(property_list):
      if prop == p:
        return { 'prop': prop, 'index': i }
    return None

  with open("public/static/lang/ja.yaml", encoding='utf-8', mode='r') as yf:
    data = yaml.load(yf)
    section = "section"
    config = configparser.ConfigParser()
    config.add_section(section)
    add_property(config, section, data, "")
    raw_property_info_list = list(map(getPropInfo, dict(config.items(section))))

  proc_word_list("ja", raw_property_info_list, property_list, ja_list, ja_list)
  for lang_info in lang_info_list:
    word_list = worksheet.col_values(lang_info["col"])
    proc_word_list(lang_info["lang"], raw_property_info_list, property_list, word_list, ja_list)

if __name__ == '__main__':
  main()
