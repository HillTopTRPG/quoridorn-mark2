from ruamel.yaml import YAML, add_constructor, resolver, RoundTripRepresenter, round_trip_dump, scalarstring, comments
import configparser
import json

def represent_str(dumper, instance):
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

def add_property(config, section, data, label_history):
  for key in data.keys():
    value = data[key]
    key = str(key)
    label = label_history + "." + key if label_history else key

    v_type = type(value)
    if v_type is str or v_type is int or v_type is scalarstring.LiteralScalarString:
      value = str(value)
      value = value.replace('%', '%%')
      value = value.replace('\n', '\\n')
      config.set(section, label, value)
    elif v_type is comments.CommentedSeq:
      value = str(value)
      value = value.replace('%', '%%')
      value = value.replace('\n', '\\n')
      value = value.replace("'", '"')
      text = value
      v_l_l = json.loads(text)
      for i, v_l in enumerate(v_l_l):
        label1 = label + '.' + str(i)
        for j, v in enumerate(v_l):
          label2 = label1 + '.' + str(j)
          config.set(section, label2, v)
    else:
      add_property(config, section, value, label)

yaml = YAML()

def main(lang):
  inputPath = "public/static/lang/{}.yaml".format(lang)
  outputPath = "public/static/lang/{}.yaml".format(lang)
  outputPath2 = "public/static/lang/{}.ini".format(lang)
  outputPath3 = "public/static/lang/{}1.txt".format(lang)
  outputPath4 = "public/static/lang/{}2.txt".format(lang)

  section = "section"
  config = configparser.ConfigParser()
  config.add_section(section)

  with open(inputPath, encoding='utf-8', mode='r') as yf:
    data = yaml.load(yf)

    output = {}
    add_property(config, section, data, "")
    with open(outputPath2, 'w') as file:
      config.write(file)
    for option in config.options(section):
      op_list = option.split(".")

      current = output
      last_prop = None
      parent = None
      for i, op in enumerate(op_list):
        if i == len(op_list) - 1:
          if op.isdigit():
            current.append(config.get(section, option))
          else:
            current[op] = config.get(section, option)
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
    with open(outputPath4, encoding='utf-8', mode='w') as file:
      file.write(json.dumps(output, indent=2, ensure_ascii=False))

    with open(outputPath, encoding='utf-8', mode='w') as file:
#       round_trip_dump(data, file, explicit_start=False)
      out = round_trip_dump(data, explicit_start=False)
      with open(outputPath3, encoding='utf-8', mode='w') as file:
        file.write(str(data))

if __name__ == '__main__':
  main("ja")
#   main("ja")
#   main("en")
#   main("fr")
#   main("zh")
#   main("co")
