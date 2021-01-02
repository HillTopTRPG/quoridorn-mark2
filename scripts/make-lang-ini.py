from ruamel.yaml import YAML, add_constructor, resolver, RoundTripRepresenter, round_trip_dump, scalarstring, comments
import configparser
import json

yaml = YAML()

def add_property(config, section, data, label_history):
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
            config.set(section, label2, v)
      else:
        config.set(section, label, value)
    else:
      add_property(config, section, value, label)

def main(lang):
  inputPath = "public/static/lang/{}.yaml".format(lang)
  outputPath2 = "public/static/lang/{}.ini".format(lang)

  section = "section"
  config = configparser.ConfigParser()
  config.add_section(section)

  with open(inputPath, encoding='utf-8', mode='r') as yf:
    data = yaml.load(yf)

    output = {}
    add_property(config, section, data, "")
    with open(outputPath2, 'w') as file:
      config.write(file)

if __name__ == '__main__':
  main("ja")
  main("en")
  main("fr")
  main("zh")
  main("co")
