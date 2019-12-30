/* lexical grammar */
/*
%{
window.console.log("-----------------------------------------------");
%}
*/
%lex
%x code-block
%x row-block
%%

<*>\r                  /* skip whitespace */
<*><<EOF>>             return 'EOF';
<row-block>"```"       return 'text';
<INITIAL>"```"         this.begin('code-block');
<code-block>"```"\n    this.popState();
<code-block>\n         return 'cb-nl';
<code-block>.          return 'cb-text';
<INITIAL,row-block>\n                     { this.begin('row-block'); return 'nl'; }
<INITIAL,row-block>\s                     { this.begin('row-block'); return 'space'; }
<INITIAL,row-block>"#"{1,6}" "*[^\r\n]+   { this.begin('row-block'); return 'header'; }
<INITIAL,row-block>">"                    { this.begin('row-block'); return 'blockquotes'; }
<INITIAL,row-block>"*"{3}.+?"*"{3}        { this.begin('row-block'); return 'bi*'; }
<INITIAL,row-block>"_"{3}.+?"_"{3}        { this.begin('row-block'); return 'bi_'; }
<INITIAL,row-block>"*"{2}.+?"*"{2}        { this.begin('row-block'); return 'b*'; }
<INITIAL,row-block>"_"{2}.+?"_"{2}        { this.begin('row-block'); return 'b_'; }
<INITIAL,row-block>("*"{3}|"_"{3}|"-"{3}) { this.begin('row-block'); return 'hr'; }
<INITIAL,row-block>"*".+?"*"              { this.begin('row-block'); return 'i*'; }
<INITIAL,row-block>"_".+?"_"\b            { this.begin('row-block'); return 'i_'; }
<INITIAL,row-block>"`".+?"`"              { this.begin('row-block'); return '`'; }
<INITIAL,row-block>[-+*]" "               { this.begin('row-block'); return 'ul'; }
<INITIAL,row-block>[0-9]+\." "            { this.begin('row-block'); return 'ol'; }
<INITIAL,row-block>"*"{1,2}               { this.begin('row-block'); return 'text'; }
<INITIAL,row-block>.                      { this.begin('row-block'); return 'text'; }

/lex

/* operator associations and precedence */

%left 'text'
%left 'ul' 'ol'
%left 'b*' 'i*' 'b_' 'i_' 'bi*' 'bi_' '`'
%left 'header' 'nl' 'paragraph' 'br' 'blockquotes' 'hr' 'cb-text'
%left BOLD

%start expressions

%% /* language grammar */

expressions
    : all-blocks EOF { return $1; }
    | EOF          { return null; }
    ;

all-blocks
    : all-blocks nl-line
        { 
          if ($1[$1.length - 1].type === 'row-block') {
            const lastItem = $1[$1.length - 1];
            if ($2.type === 'nl') {
              lastItem.value[lastItem.value.length - 1].nlCount += $2.nlCount;
            } else {
              if (
                lastItem.value[lastItem.value.length - 1].type === $2.type &&
                lastItem.value[lastItem.value.length - 1].nlCount === 1 &&
                ('length' in $2.value) &&
                (
                    $2.type === 'ul' ||
                    $2.type === 'ol'
                )
              ) {
                lastItem.value[lastItem.value.length - 1].value.push(...$2.value);
              } else {
                lastItem.value.push($2);
              }
            }
          } else {
            $1.push({ type: 'row-block', value: [$2] });
          }
          $$ = $1;
        }
    | all-blocks 'cb-text'
        { 
          if ($1[$1.length - 1].type === 'row-block') {
            $1.push({ type: 'cb-block', value: $2 });
          } else {
            $1[$1.length - 1].value += $2;
          }
          $$ = $1;
        }
    | all-blocks 'cb-nl'
        { 
          if ($1[$1.length - 1].type === 'row-block') {
            $1.push({ type: 'cb-block', value: $2 });
          } else {
            $1[$1.length - 1].value += $2;
          }
          $$ = $1;
        }
    | nl-line
        { $$ = [{ type: 'row-block', value: [$1] }]; }
    | 'cb-text'
        { $$ = [{ type: 'cb-block', value: $1 }]; }
    | 'cb-nl'
        { $$ = [{ type: 'cb-block', value: $1 }]; }
    ;

nl-line
    : div 'nl'
        {
            if ('length' in $1) {
                $$ = { type: 'line', value: $1, nlCount: 1 };
            } else {
                $1.nlCount = 1;
                $$ = $1;
            }
        }
    | 'hr' 'nl' { $$ = { type: 'hr', nlCount: 1 }; }
    | 'ul' spans 'nl' { $$ = { type: 'ul', value: [$2], nlCount: 1 }; }
    | 'ol' spans 'nl' { $$ = { type: 'ol', value: [$2], nlCount: 1 }; }
    | 'nl'      { $$ = { type: 'nl', nlCount: 1 }; }
    ;

div
    : 'blockquotes' div { $$ = { type: 'blockquotes', value: $2 }; }
    | spans 'header'
         {
             if ($1[$1.length - 1].type === "text") {
                 $1[$1.length - 1].value += $2;
             } else {
                 $1.push({ type: 'text', value: $2 });
             }
             $$ = $1;
         }
    | spans             { $$ = $1; }
    | 'blockquotes'     { $$ = { type: 'text', value: $1 }; }
    | 'header'          { $$ = { type: `h${/^#+/.exec($1)[0].length}`, value: $1.replace(/^#+/, "") }; }
    | 'ul' { $$ = { type: 'text', value: $1 }; }
    | 'ol' { $$ = { type: 'text', value: $1 }; }
    ;

spans
    : spans 'space'
        {
            if ($1[$1.length - 1].type === 'text') {
                $1[$1.length - 1].value += $2;
            } else {
                $1.push({ type: "text", value: $2 });
            }
            $$ = $1;
        }
    | spans span
        {
            if ($1[$1.length - 1].type === $2.type) {
                $1[$1.length - 1].value += $2.value;
            } else {
                $1.push($2);
            }
            $$ = $1;
        }
    | span    { $$ = [ $1 ]; }
    | 'space' { $$ = [ { type: 'text', value: $1 } ]; }
    ;

span
    : 'bi*'       { $$ = { type: 'bold-italic', value: $1.replace(/(^\*\*\*)|(\*\*\*$)/g, '') }; }
    | 'bi_'       { $$ = { type: 'bold-italic', value: $1.replace(/(^___)|(___$)/g, '') }; }
    | 'b*'        { $$ = { type: 'bold', value: $1.replace(/(^\*\*)|(\*\*$)/g, '') }; }
    | 'b_'        { $$ = { type: 'bold', value: $1.replace(/(^__)|(__$)/g, '') }; }
    | 'i*'        { $$ = { type: 'italic', value: $1.replace(/(^\*)|(\*$)/g, '') }; }
    | 'i_'        { $$ = { type: 'italic', value: $1.replace(/(^_)|(_$)/g, '') }; }
    | '`'         { $$ = { type: 'i-code', value: $1.replace(/(^`)|(`$)/g, '') }; }
    | 'hr' 'text' { $$ = { type: 'text', value: $1 + $2 }; }
    | 'text' 'hr' { $$ = { type: 'text', value: $1 + $2 }; }
    | 'text' 'ul' { $$ = { type: 'text', value: $1 + $2 }; }
    | 'text' 'ol' { $$ = { type: 'text', value: $1 + $2 }; }
    | 'space' 'ul' { $$ = { type: 'text', value: $1 + $2 }; }
    | 'space' 'ol' { $$ = { type: 'text', value: $1 + $2 }; }
    | 'text'      { $$ = { type: 'text', value: $1 }; }
    ;
