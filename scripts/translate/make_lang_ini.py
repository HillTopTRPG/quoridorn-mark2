from ruamel.yaml import YAML, add_constructor, resolver, RoundTripRepresenter, round_trip_dump, scalarstring, comments
import configparser
import json
from yaml_processor import YamlProcessor

def execute(yaml_processor, lang):
  yaml_path = "public/static/lang/{}.yaml".format(lang)
  ini_path = "public/static/lang/{}.ini".format(lang)
  yaml_processor.makeIni(yaml_path, ini_path)

if __name__ == '__main__':
  yaml_processor = YamlProcessor()
  execute(yaml_processor, "ja")
#   execute(yaml_processor, "en")
#   execute(yaml_processor, "co")
#   execute(yaml_processor, "fr")
#   execute(yaml_processor, "zh")
