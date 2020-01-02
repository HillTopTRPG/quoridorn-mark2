/* lexical grammar */

%{
console.log("------------");
function lex(type, state) {
  if (state && this.conditionStack[this.conditionStack.length - 1] !== state) this.begin(state);
  else if (state === '') this.popState();
  return type;
}
function span(type, raw, regExp, func, connectable) {
  const result = { type, value: raw.replace(regExp, func), raw };
  if (connectable) result.connectable = true;
  return result;
}
function spansRaw(spans) {
  return spans.reduce((acc, cur) => acc + cur.raw, '');
}
function parseTableLine(item) {
  item.type = '.';
  item.value = item.raw;
  item.connectable = true;
  return item;
}
function arrangeTableLineList(list) {
  let i = 0;
  while (i < list.length) {
    const item = list[i];
    if (!item.connectable || i + 1 > list.length - 1) {
      i++;
      continue;
    }
    const next = list[i + 1];
    if (item.type === next.type && next.connectable) {
      item.value += next.value;
      item.raw += next.raw;
      list.splice(i + 1, 1);
    } else {
      i++;
    }
  }
}
function fixSpans(spans, isRow) {
  if (isRow) {
    const result = [];
    spans.forEach(s => {
      if (s.type === '<->') {
        result.push(parseTableLine(s));
      } else if (s.type === '|' && isRow === 1) {
        result.push({ type: '.', value: s.raw, raw: s.raw, connectable: true });
      } else {
        result.push(s);
      }
    });
    arrangeTableLineList(result);
    return result;
  } else {
    if (spans.findIndex(s => !s.isTableSpan) > -1) {
      const result = [];
      spans.forEach(s => {
        if (s.type === '<->') {
          result.push(parseTableLine(s));
        } else {
          result.push(s);
        }
      });
      arrangeTableLineList(result);
      return result;
    }
    return spans;
  }
}
%}

%lex
%x SPAN
%%

<*><<EOF>>                 return lex.call(this, 'EOF');
<INITIAL,SPAN>' '*'|'' '*  return lex.call(this, '|', 'SPAN');
<INITIAL,SPAN>' '*':'?'-'+':'?' '*
                           return lex.call(this, '<->', 'SPAN');
<INITIAL>' '*'>'           return lex.call(this, '>', 'SPAN');
<INITIAL>' '*('*'|'-')' '* return lex.call(this, 'ul', 'SPAN');
<INITIAL>' '*[0-9]+'.'' '* return lex.call(this, 'ol', 'SPAN');
<INITIAL>' '*('***'|'---'|'+++'|'___')' '*\r?\n
                           return lex.call(this, 'hr');
<INITIAL>'#'{1,6}.+?\r?\n  return lex.call(this, '#');
<INITIAL,SPAN>('***'.+?'***')|('___'.+?'___')
                           return lex.call(this, 'bi', 'SPAN');
<INITIAL,SPAN>('**'.+?'**')|('__'.+?'__')
                           return lex.call(this, 'b', 'SPAN');
<INITIAL,SPAN>('*'.+?'*')|('_'.+?'_')
                           return lex.call(this, 'i', 'SPAN');
<INITIAL,SPAN>'`'[^\r\n`]+?'`'
                           return lex.call(this, '`', 'SPAN');
<INITIAL>'```'(\s|.)+?'```'\r?\n
                           return lex.call(this, '```');
<SPAN>\r?\n                return lex.call(this, 'nl', '');
<SPAN>.                    return lex.call(this, '.');
<INITIAL>\r?\n             return lex.call(this, 'nl');
<*>\r?\n                   return lex.call(this, 'nl', '');
<*>.                       return lex.call(this, '.', 'SPAN');

/lex

/* operator associations and precedence */

%left '.'
%left '```'
%left 'hr' 'ul' 'ol' '>'
%left 'bi' 'b' 'i' '`'
%left '|' '<->'
%left 'nl'
%left 'EOF'

%start expressions

%% /* language grammar */

expressions
    : 'EOF'       { return null; }
    | block 'EOF'
      { if ($1[$1.length - 1].type === 'UNKNOWN-BLOCK') {
          const lastBlock = $1[$1.length - 1];
          const line = lastBlock.value[0];
          lastBlock.type = 'RAW-BLOCK';
          line.type = 'line';
          line.value = fixSpans(line.value, 1);
        }
        return $1;
      }
    ;

block
    : block line
      { const lastBlock = $1[$1.length - 1];
        const lastBlockLines = lastBlock.value;
        const lastLine = lastBlockLines[lastBlockLines.length - 1];
        if (lastBlock.type === 'UNKNOWN-BLOCK') {
          // UNKNOWNの決定
          if (
            lastLine.type.startsWith('table-line') &&
            $2.type === 'table-line-def' &&
            lastLine.colCount === $2.colCount
          ) {
            // テーブル化
            lastBlock.type = 'TABLE-BLOCK';
            lastBlock.colNum = lastLine.colCount;
            if (lastLine.type === 'table-line-def') {
              lastLine.type = 'table-line';
              lastLine.value = fixSpans(lastLine.value, 2);
            }
          } else {
            // テーブルではない

            // RAW-BLOCK化する
            lastBlock.type = 'RAW-BLOCK';
            if (lastLine.type.startsWith('table-line')) {
              lastLine.type = 'line';
              lastLine.value = fixSpans(lastLine.value, 1);
            }
            if ($2.type === 'nl') {
              lastLine.nlCount += $2.nlCount;
              lastBlock.nlCount = lastLine.nlCount;
              return;
            }

            // その前のブロックと同じだったら混ぜてブロック消す
            if ($1.length > 1 && $1[$1.length - 2].type === 'RAW-BLOCK') {
              $1[$1.length - 2].value.push(...lastBlock.value);
              $1[$1.length - 2].nlCount = lastBlock.nlCount;
              $1.splice($1.length - 1);
            }

            if ($2.type.startsWith('table-line')) {
              $2.type = 'line';
              $2.value = fixSpans($2.value, 1);
            }
            else if ($2.type === 'ul') $1.push({ type: 'UL-BLOCK', value: [], nlCount: 1 });
            else if ($2.type === 'ol') $1.push({ type: 'OL-BLOCK', value: [], nlCount: 1 });
          }
        } else if (lastBlock.type === 'RAW-BLOCK') {
          if ($2.type === 'nl') {
            lastLine.nlCount += $2.nlCount;
            return;
          }
          if ($2.type.startsWith('table-line') > -1) $1.push({ type: 'UNKNOWN-BLOCK', value: [], nlCount: 1 });
          else if ($2.type === 'ul') $1.push({ type: 'UL-BLOCK', value: [], nlCount: 1 });
          else if ($2.type === 'ol') $1.push({ type: 'OL-BLOCK', value: [], nlCount: 1 });
        } else if (lastBlock.type === 'TABLE-BLOCK') {
          if ($2.type === 'nl') {
            lastBlock.nlCount += $2.nlCount;
            return;
          }
          if (lastBlock.nlCount > 1) {
            if ($2.type.startsWith('table-line')) $1.push({ type: 'UNKNOWN-BLOCK', value: [], nlCount: 1 });
            else if ($2.type === 'ul') $1.push({ type: 'UL-BLOCK', value: [], nlCount: 1 });
            else if ($2.type === 'ol') $1.push({ type: 'OL-BLOCK', value: [], nlCount: 1 });
            else $1.push({ type: 'RAW-BLOCK', value: [], nlCount: 1 });
          } else {
            if ($2.type === 'table-line-def') {
              $2.type = 'table-line';
              $2.value = fixSpans($2.value, 2);
            }
            if ($2.type === 'line') { /* TABLEのtbodyにはlineを許容 */ }
            else if ($2.type === 'ul') $1.push({ type: 'UL-BLOCK', value: [], nlCount: 1 });
            else if ($2.type === 'ol') $1.push({ type: 'OL-BLOCK', value: [], nlCount: 1 });
            else $1.push({ type: 'RAW-BLOCK', value: [], nlCount: 1 });
          }
        } else if (lastBlock.type === 'UL-BLOCK') {
          if ($2.type === 'nl') {
            lastBlock.nlCount += $2.nlCount;
            return;
          }
          if ($2.type === 'ul') {
            if (lastBlock.nlCount > 1) $1.push({ type: 'UL-BLOCK', value: [], nlCount: 1 });
          }
          else if ($2.type === 'ol') $1.push({ type: 'OL-BLOCK', value: [], nlCount: 1 });
          else if ($2.type.startsWith('table-line')) $1.push({ type: 'UNKNOWN-BLOCK', value: [], nlCount: 1 });
          else $1.push({ type: 'RAW-BLOCK', value: [], nlCount: 1 });
        } else if (lastBlock.type === 'OL-BLOCK') {
          if ($2.type === 'nl') {
            lastBlock.nlCount += $2.nlCount;
            return;
          }
          if ($2.type === 'ol') {
            if (lastBlock.nlCount > 1) $1.push({ type: 'OL-BLOCK', value: [], nlCount: 1 });
          }
          else if ($2.type === 'ul') $1.push({ type: 'UL-BLOCK', value: [], nlCount: 1 });
          else if ($2.type.startsWith('table-line')) $1.push({ type: 'UNKNOWN-BLOCK', value: [], nlCount: 1 });
          else $1.push({ type: 'RAW-BLOCK', value: [], nlCount: 1 });
        }
        $1[$1.length - 1].value.push($2);
      }
    | line
      { if ($1.type === 'ul') $$ = [{ type: 'UL-BLOCK', value: [$1], nlCount: 1 }];
        else if ($1.type === 'ol') $$ = [{ type: 'OL-BLOCK', value: [$1], nlCount: 1 }];
        else if ($1.type.startsWith('table-line')) $$ = [{ type: 'UNKNOWN-BLOCK', value: [$1], nlCount: 1 }];
        else $$ = [{ type: 'RAW-BLOCK', value: [$1], nlCount: 1 }];
      }
    ;

line
    : '>' spans 'nl' { $$ = { type: '>', value: fixSpans($2, 1), raw: $1 + spansRaw($2), nlCount: 1 }; }
    | 'ul' spans 'nl' { $$ = { type: 'ul', value: fixSpans($2, 1), raw: $1 + spansRaw($2), nlCount: 1 }; }
    | 'ol' spans 'nl' { $$ = { type: 'ol', value: fixSpans($2, 1), raw: $1 + spansRaw($2), nlCount: 1 }; }
    | '>' 'nl' { $$ = { type: 'line', value: [span('.', $1, /^.+$/, m => m)], raw: $1, nlCount: 1 }; }
    | 'ul' 'nl' { $$ = { type: 'line', value: [span('.', $1, /^.+$/, m => m)], raw: $1, nlCount: 1 }; }
    | 'ol' 'nl' { $$ = { type: 'line', value: [span('.', $1, /^.+$/, m => m)], raw: $1, nlCount: 1 }; }
    | '#' { $$ = { type: `h${$1.match(/^#+/)[0].length}`, value: $1.replace(/^#+ *(.+)$/, (m, p1) => p1), raw: $1, nlCount: 1 }; }
    | 'hr' { $$ = { type: 'hr', raw: $1, nlCount: 1 }; }
    | '```' { $$ = { type: '```', value: $1.replace(/^\`\`\`((?:.|\s)+?)\`\`\`$/, (m, p1) => p1), raw: $1, nlCount: 1 }; }
    | spans 'nl'
      { $$ = { type: 'line', value: fixSpans($1, 0), raw: spansRaw($1), nlCount: 1 };
        let nonCountDev = 0;
        let rawCount = 0;
        let devCount = 0;
        let aroCount = 0;
        $$.value.forEach((s, idx) => {
          if (!s.isTableSpan) rawCount++;
          if (s.type === '|') {
            devCount++;
            if (idx === 0 || idx === $$.value.length - 1) nonCountDev++;
          }
          if (s.type === '<->') aroCount++;
        });
        if (rawCount === 0 && aroCount > 0) {
          $$.type = 'table-line-def';
          $$.colCount = devCount + 1 - nonCountDev;
        }
        if (devCount > 0 && aroCount === 0) {
          $$.type = 'table-line';
          $$.colCount = devCount + 1 - nonCountDev;
        }
      }
    | 'nl' { $$ = { type: 'nl', raw: $1, nlCount: 1 }; }
    ;

spans
    : spans span
      {
        if (
          $1[$1.length - 1].type === $2.type &&
          $1[$1.length - 1].connectable &&
          $2.connectable
        ) {
          $1[$1.length - 1].value += $2.value;
          $1[$1.length - 1].raw += $2.raw;
        } else {
          const last = $1[$1.length - 1];
          if (last.type === '<->' && $2.type !== '|') {
            $1.splice($1.length - 1, 1, parseTableLine(last), $2);
            arrangeTableLineList($1);
          } else if (last.type !== '|' && $2.type === '<->') {
            $1.splice($1.length - 1, 1, last, parseTableLine($2));
            arrangeTableLineList($1);
          } else {
            $1.push($2);
          }
        }
      }
    | span { $$ = [$1]; }
    ;

span
    : text-span
    | '<->'
      { $$ = { type: '<->', raw: $1, isTableSpan: true };
        if ($$.raw.trim().startsWith(':') && $$.raw.trim().endsWith(':')) $$.align = 'center';
        else if ($$.raw.trim().startsWith(':')) $$.align = 'left';
        else if ($$.raw.trim().endsWith(':')) $$.align = 'right';
        else $$.align = 'none';
      }
    | '|'   { $$ = { type: '|', raw: $1, isTableSpan: true }; }
    ;

text-span
    : 'bi'  { $$ = span('bi', $1, /^(?:\*\*\*(.+?)\*\*\*)|(?:___(.+?)___)$/, (m, p1, p2) => p1 || p2, true); }
    | 'b'   { $$ = span('b', $1, /^(?:\*\*(.+?)\*\*)|(?:__(.+?)__)$/, (m, p1, p2) => p1 || p2, true); }
    | 'i'   { $$ = span('i', $1, /^(?:\*(.+?)\*)|(?:_(.+?)_)$/, (m, p1, p2) => p1 || p2, true); }
    | '`'   { $$ = span('`', $1, /^(?:`(.+?)`)$/, (m, p1) => p1); }
    | '.'   { $$ = span('.', $1, /^.$/, m => m, true); }
    ;
