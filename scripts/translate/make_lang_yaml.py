from spread_sheet_processor import SpreadSheetProcessor
from yaml_processor import YamlProcessor

class MakeLangYaml(object):

  def __init__(self):
    self.yaml_processor = YamlProcessor()


  def __setProperty(self, object, property, value):
    op_list = property.split(".")

    current = object
    last_prop = None
    parent = None
    for i, op in enumerate(op_list):
      if i == len(op_list) - 1:
        if op.isdigit():
          current.append(value)
        else:
          current[op] = value
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

  def __proc_word_list(self, lang, original_property_list, property_list, translated_list, ja_list):
    print("--", lang)
    output = {}

    # オリジナルのyamlのプロパティの順番に準拠してオブジェクトを作っていく
    for original_property in original_property_list:
      index = property_list.index(original_property)

      # プロパティ
      property = property_list[index]

      # 値(翻訳結果):無ければ日本語を使う
      value = translated_list[index] if index < len(translated_list) else ""
      if value == "":
        value = ja_list[index]

      # オブジェクトにプロパティ(カンマ区切り)をオブジェクトの階層に分解しながら値を設定する
      self.__setProperty(output, property, value)

    # できたデータをyamlに保存(上書き)する
    self.yaml_processor.dump('public/static/lang/{}.yaml'.format(lang), output)

  def execute(self):
    translateSpreadSheetReader = SpreadSheetProcessor()
    property_list, ja_list, other_lang = translateSpreadSheetReader.getWorkSheetLangInfo()
    original_property_list = self.yaml_processor.getKeyList("public/static/lang/ja.yaml")

    self.__proc_word_list("ja", original_property_list, property_list, ja_list, ja_list)
    for lang in other_lang.keys():
      translated_list = other_lang[lang]
      self.__proc_word_list(lang, original_property_list, property_list, translated_list, ja_list)

if __name__ == '__main__':
  make_lang_yaml = MakeLangYaml()
  make_lang_yaml.execute()
