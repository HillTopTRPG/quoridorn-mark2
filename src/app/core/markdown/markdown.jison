/* lexical grammar */
/*
%{
window.console.log("-----------------------------------------------");
%}
*/
%lex
%x ROW
%x HEADER
%x TABLE
%x CODE-BLOCK
%x CODE
%%

<*>\r                               /* skip whitespace */
<*><<EOF>>                          return 'EOF';
<ROW>"#"                            return 'text';
<ROW>"```"                          return 'text';
<INITIAL>"#"{1,6}                   { this.begin('HEADER'); return '#'; }
<HEADER>[^\n]+                      return '#text';
<INITIAL>"```"                      { this.begin('CODE-BLOCK'); return '```'; }
<CODE-BLOCK>"```"\n                 { this.popState(); return '```end'; }
<CODE-BLOCK>\n                      return '```nl';
<CODE-BLOCK>.                       return '```text';
<INITIAL,ROW,TABLE>"`"              { this.begin('CODE'); return '`'; }
<CODE>"`"                           this.popState();
<CODE>\n                            { this.popState(); return 'c-rollback' }
<CODE>.                             return 'c-text';
<INITIAL,ROW,TABLE>"|"              { this.begin('TABLE'); return '|'; }
<INITIAL,ROW>">"                    { this.begin('ROW'); return 'blockquote'; }
<INITIAL,ROW>("*"{3}|"_"{3}|"-"{3}) { this.begin('ROW'); return 'hr'; }
<INITIAL,ROW>"*"{3}.+?"*"{3}        { this.begin('ROW'); return 'bi*'; }
<INITIAL,ROW>"_"{3}.+?"_"{3}        { this.begin('ROW'); return 'bi_'; }
<INITIAL,ROW>"*"{2}.+?"*"{2}        { this.begin('ROW'); return 'b*'; }
<INITIAL,ROW>"_"{2}.+?"_"{2}        { this.begin('ROW'); return 'b_'; }
<INITIAL,ROW>"*".+?"*"              { this.begin('ROW'); return 'i*'; }
<INITIAL,ROW>"_".+?"_"              { this.begin('ROW'); return 'i_'; }
<INITIAL,ROW>[-+*]" "               { this.begin('ROW'); return 'ul'; }
<INITIAL,ROW>[0-9]+\." "            { this.begin('ROW'); return 'ol'; }
<INITIAL,ROW>"*"{1,2}               { this.begin('ROW'); return 'text'; }
<ROW,HEADER>\n                      { this.conditionStack.splice(1, this.conditionStack.length); return 'nl'; }
<*>\n                               return 'nl';
<INITIAL,ROW>\s                     { this.begin('ROW'); return 'space'; }
<INITIAL>.                          { this.begin('ROW'); return 'text'; }
<ROW,TABLE>.                        { return 'text'; }

/lex

/* operator associations and precedence */

%left 'text'
%left 'ul' 'ol'
%left 'hr'
%left 'b*' 'i*' 'b_' 'i_' 'bi*' 'bi_' '`' '```'
%left '#' 'nl' 'paragraph' 'br' 'blockquote' '```text'
%right '|' c-rollback
%left BOLD

%start expressions

%% /* language grammar */

expressions
    : all-blocks EOF
        { if ($1[$1.length - 1].type === 'cb-block' && !$1[$1.length - 1].closed) {
            const text = $1[$1.length - 1].value;
            const block = {
              type: 'row-block',
              value: [
                text.split(/\n/g).reduce((acc, cur, idx) => {
                  if (acc.length) acc[acc.length - 1].nlCount++;
                  if (idx === 0) cur = '```' + cur;
                  if (cur === '') {
                    if (!acc.length) acc.push({ type: 'nl', nlCount: 0 });
                  } else {
                    acc.push({ type: 'text', value: cur, nlCount: 0 });
                  }
                  return acc;
                }, [])
              ]
            }
            $1[$1.length - 1] = block;
          }
          return $1;
        }
    | EOF
        { return null; }
    ;

all-blocks
    : all-blocks div
        { if ($1[$1.length - 1].type === 'row-block') {
            const lastBlock = $1[$1.length - 1];
            const lastLine = lastBlock.value[lastBlock.value.length - 1];
            const lastSpan = lastLine[lastLine.length - 1];
            const last2 = $2[$2.length - 1];
            if (last2.type === 'nl') {
              lastSpan.nlCount += last2.nlCount;
            } else {
              if (
                lastSpan.type === last2.type &&
                lastSpan.nlCount === 1 &&
                ( last2.type === 'ul' ||
                  last2.type === 'ol'
                )
              ) {
                lastSpan.value.push(...last2.value);
              } else {
                lastBlock.value.push(...$2);
              }
            }
          } else {
            $1.push({ type: 'row-block', value: $2 });
          }
          $$ = $1;
        }
    | all-blocks '```'
        { $1.push({ type: 'cb-block', value: '' }); }
    | all-blocks '```end'
        { $1[$1.length - 1].closed = true; }
    | all-blocks '```text'
        { $1[$1.length - 1].value += $2; }
    | all-blocks '```nl'
        { $1[$1.length - 1].value += $2; }
    | div
        { $$ = [{ type: 'row-block', value: $1 }]; }
    | '```'
        { $$ = [{ type: 'cb-block', value: '' }]; }
    ;

div
    : 'blockquote' spans 'nl'
        { $$ = [{ type: 'blockquote', value: $2, nlCount: 1 }]; }
    | 'ul' spans 'nl'
        { $$ = [{ type: 'ul', value: [$2], nlCount: 1 }]; }
    | 'ol' spans 'nl'
        { $$ = [{ type: 'ol', value: [$2], nlCount: 1 }]; }
    | spans 'nl'
        { $1[$1.length - 1].nlCount = 1;
          $$ = [$1]
        }
    | spans 'c-rollback'
        { if ($1[$1.length - 1].type === "code") {
            $1[$1.length - 1].type = 'text';
            $1[$1.length - 1].value = '`' + $1[$1.length - 1].value;
          }
        }
    | 'blockquote' 'nl'
        { $$ = [{ type: 'text', value: $1, nlCount: 1 }]; }
    | 'ul' 'nl'
        { $$ = [{ type: 'text', value: $1, nlCount: 1 }]; }
    | 'ol' 'nl'
        { $$ = [{ type: 'text', value: $1, nlCount: 1 }]; }
    | '#' 'nl'
        { $$ = [{ type: `h${$1.length}`, value: '', nlCount: 1 }]; }
    | '#' '#text' 'nl'
        { $$ = [{ type: `h${$1.length}`, value: $2, nlCount: 1 }]; }
    | 'hr' 'nl'
        { $$ = [{ type: 'hr', nlCount: 1 }]; }
    | 'nl'
        { $$ = [{ type: 'nl', nlCount: 1 }]; }
    ;

spans
    : spans 'space'
        { if ($1[$1.length - 1].type === 'text') $1[$1.length - 1].value += $2;
          else $1.push({ type: "text", value: $2 });
        }
    | spans 'hr'
        { if ($1[$1.length - 1].type === 'text') $1[$1.length - 1].value += $2;
          else $1.push({ type: "text", value: $2 });
        }
    | spans 'ul'
        { if ($1[$1.length - 1].type === 'text') $1[$1.length - 1].value += $2;
          else $1.push({ type: "text", value: $2 });
        }
    | spans 'ol'
        { if ($1[$1.length - 1].type === 'text') $1[$1.length - 1].value += $2;
          else $1.push({ type: "text", value: $2 });
        }
    | spans span
        { if ($1[$1.length - 1].type === $2.type && !$2.isNew) $1[$1.length - 1].value += $2.value;
          else {
            delete $2.isNew;
            $1.push($2);
          }
        }
    | span
        { delete $1.isNew; $$ = [ $1 ]; }
    | 'space'
        { $$ = [ { type: 'text', value: $1 } ]; }
    ;

span
    : 'bi*'
        { $$ = { type: 'bold-italic', value: $1.replace(/(^\*\*\*)|(\*\*\*$)/g, '') }; }
    | 'bi_'
        { $$ = { type: 'bold-italic', value: $1.replace(/(^___)|(___$)/g, '') }; }
    | 'b*'
        { $$ = { type: 'bold', value: $1.replace(/(^\*\*)|(\*\*$)/g, '') }; }
    | 'b_'
        { $$ = { type: 'bold', value: $1.replace(/(^__)|(__$)/g, '') }; }
    | 'i*'
        { $$ = { type: 'italic', value: $1.replace(/(^\*)|(\*$)/g, '') }; }
    | 'i_'
        { $$ = { type: 'italic', value: $1.replace(/(^_)|(_$)/g, '') }; }
    | '`'
        { $$ = { type: 'code', value: '', isNew: true }; }
    | 'c-text'
        { $$ = { type: 'code', value: $1 }; }
    | 'hr' 'text'
        { $$ = { type: 'text', value: $1 + $2 }; }
    | 'hr' 'space'
        { $$ = { type: 'text', value: $1 + $2 }; }
    | 'text'
        { $$ = { type: 'text', value: $1 }; }
    ;
