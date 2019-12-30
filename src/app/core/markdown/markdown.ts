const jison = require("jison");
const markdownParser = new jison.Parser(require("./markdown.jison").default);

export function markdown(text: string) {
  return markdownParser.parse(text);
}
