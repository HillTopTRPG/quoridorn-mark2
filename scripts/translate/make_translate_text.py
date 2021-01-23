from translate_processor_ibm import TranslateProcessorIbm
from os.path import normpath, join, dirname, abspath

def execute(input_file_name, output_file_name, lang_model_id):
  input_file_path = normpath(join(dirname(abspath(__file__)), './' + input_file_name))
  output_file_path = normpath(join(dirname(abspath(__file__)), './' + output_file_name))

  translator = TranslateProcessorIbm()
  original_text_list = []
  translated_text_list = []

  with open(input_file_path, encoding='utf-8', mode='r') as file:
    data = file.read()
    original_text_list = data.splitlines()
    original_text_list = list(map(lambda t:t.replace("、\\n", "、"), original_text_list))
    results = translator.translate(original_text_list, lang_model_id)
    translated_text_list = results["list"]

  with open(output_file_path, encoding='utf-8', mode='w') as file:
    file.write("\n".join(translated_text_list))


if __name__ == '__main__':
  execute('en.txt', 'ko.txt', 'en-ko')
  execute('en.txt', 'zh.txt', 'en-zh')
  execute('en.txt', 'fr.txt', 'en-fr')
