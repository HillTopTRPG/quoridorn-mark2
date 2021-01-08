from ruamel.yaml import YAML, add_constructor, resolver, RoundTripRepresenter, round_trip_dump, scalarstring, comments
import configparser
import json
import re

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

class YamlProcessor(object):
  __SECTION = "section"

  def __init__(self):
    self.__yaml = YAML()

  def __add_property(self, config, data, label_history):
    for key in data.keys():
      value = data[key]
      key = str(key)
      label = label_history + "." + key if label_history else key

      v_type = type(value)
      if v_type is str or v_type is int or v_type is scalarstring.LiteralScalarString or v_type is comments.CommentedSeq:
        value = str(value)
        value = value.replace('%', '%%')
        value = value.replace('\n', '\\n')
        value = value.replace("'", '"')
        if v_type is comments.CommentedSeq:
          v_l_l = json.loads(value)
          for i, v_l in enumerate(v_l_l):
            label1 = label + '.' + str(i)
            for j, v in enumerate(v_l):
              label2 = label1 + '.' + str(j)
              config.set(YamlProcessor.__SECTION, label2, v)
        else:
          config.set(YamlProcessor.__SECTION, label, value)
      else:
        self.__add_property(config, value, label)

  def __createConfig(self, path):
    with open(path, encoding='utf-8', mode='r') as file:
      data = self.__yaml.load(file)

      config = configparser.ConfigParser()
      config.add_section(YamlProcessor.__SECTION)

      self.__add_property(config, data, "")
      return config

  def getKeyList(self, path):
    config = self.__createConfig(path)
    return dict(config.items(YamlProcessor.__SECTION))

  def makeIni(self, yaml_path, ini_path):
    config = self.__createConfig(yaml_path)
    with open(ini_path, 'w') as file:
      config.write(file)

  def dump(self, path, data):
    with open(path, encoding='utf-8', mode='w') as file:
      out = round_trip_dump(data, explicit_start=False)
      out = re.sub(r'^([^ ])', r'\n\1', out, flags=re.MULTILINE)
      round_trip_dump(self.__yaml.load(out), file, explicit_start=False)
