# ==================================================
# チャットログ(HTML)テンプレートファイル生成スクリプト
# ==================================================

# 正規表現
import re
# ファイル操作
import os
# ファイルコピー
import shutil

# --------------------------------------------------
# 定数
BASE_HTML_ORG = "dist/chatLog.html"
BASE_HTML     = "dist/chatLog_new.html"
OUTPUT_HTML   = "dist/static/chatLogTemplate.html"
DEVELOP_HTML  = "public/static/chatLogTemplate.html"

# --------------------------------------------------
PATTERN_INPUT_SCRIPT = [
    re.compile("<script src=.+(js/.+)><\/script>"),
    "<script type=\"text/javascript\">\n\1\n</script>"
]

PATTERN_INPUT_CSS = [
    re.compile("<link href=.+(css/.+) rel=stylesheet>"),
    "<style type=\"text/css\">\n\1\n</style>"
]

# --------------------------------------------------
# 指定されたファイルが存在したら空のファイルにする
# 存在しなければ空のファイルを作る
def initFile(path):
    if os.path.isfile(path):
        os.remove(path)
    with open(path, "w", encoding="UTF-8") as f:
        pass

# --------------------------------------------------
# 正規表現に引っかかったら、そこに書いてあるパスのファイルの内容を整形して返却する
# 正規表現に引っかからなければ、引数のテキストをそのまま返却する
def getIncludeText(regInfoArr, line):
    # 引数配列ぐるぐる
    for regInfo in regInfoArr:
        # 検索
        result = regInfo[0].search(line)
        if (result):
            # 対象ファイルのパスを取得
            path = "dist/" + result.group(1)
            with open(path) as fr:
                # ファイルの内容を全取得
                lines = fr.read()
                # テンプレートに流し込んで返却
                return regInfo[1].replace("\1", lines)
    # 1つも引っかからなければ元のテキストを返却
    return line

# --------------------------------------------------
# キレイに行に分解してあげる
with open(BASE_HTML_ORG) as fr:
    lines = fr.read()
    lines = re.sub('(?!<br)(<[^/!])', r'\n\1', lines)
    lines = re.sub('(<\/body>)', r'\n\1', lines)
    lines = re.sub('(<\/head>)', r'\n\1', lines)
    lines = re.sub('<link.+ rel=\"?preload\"?.*>\n', '', lines)
    with open(BASE_HTML, mode='w') as fw:
        fw.write(lines)

# --------------------------------------------------
# 成果物を出力する
initFile(OUTPUT_HTML)
with open(BASE_HTML) as fr:
    line = fr.readline()
    while line:
        # キレイな行の単位
        # print(line, end="")
        convertedStr = getIncludeText([PATTERN_INPUT_SCRIPT, PATTERN_INPUT_CSS], line)
        convertedStr = re.sub(r'^\@charset \"UTF-8\";', '', convertedStr, flags=re.MULTILINE)
        with open(OUTPUT_HTML, mode='a') as fa:
            print(convertedStr, file=fa, end="")
        line = fr.readline()

# --------------------------------------------------
# 後処理

# 中間ファイルを削除する
os.remove(BASE_HTML)

# 逆輸入
shutil.copyfile(OUTPUT_HTML, DEVELOP_HTML)
