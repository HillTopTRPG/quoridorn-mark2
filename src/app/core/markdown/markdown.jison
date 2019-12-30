/* lexical grammar */
/*
%{
window.console.log("-----------------------------------------------");
%}
*/
%lex
%%

\r                     /* skip whitespace */
\n                     return 'nl'
\s                     return 'space'
"#"{1,6}" "*[^\r\n]+   return 'header'
">"                    return 'blockquotes'
"*"{3}.+?"*"{3}        return 'bi*'
"_"{3}.+?"_"{3}        return 'bi_'
"*"{2}.+?"*"{2}        return 'b*'
"_"{2}.+?"_"{2}        return 'b_'
("*"{3}|"_"{3}|"-"{3}) return 'hr'
"*".+?"*"              return 'i*'
"_".+?"_"\b            return 'i_'
"`".+?"`"              return '`'
[-+*]" "               return 'ul'
[0-9]+\." "            return 'ol'
<<EOF>>                return 'EOF'
"*"{1,2}               return 'text'
.                      return 'text'

/lex

/* operator associations and precedence */

%left 'text'
%left 'ul' 'ol'
%left 'b*' 'i*' 'b_' 'i_' 'bi*' 'bi_' '`'
%left 'header' 'nl' 'paragraph' 'br' 'blockquotes' 'hr'
%left BOLD

%start expressions

%% /* language grammar */

expressions
    : nl-lines EOF { return $1; }
    | EOF          { return null; }
    ;

nl-lines
    : nl-lines nl-line
        {
            if ($2.type === 'nl') {
                $1[$1.length - 1].nlCount += $2.nlCount;
            } else {
                if (
                    $1[$1.length - 1].type === $2.type &&
                    $1[$1.length - 1].nlCount === 1 &&
                    ('length' in $2.value) &&
                    (
                        $2.type === 'ul' ||
                        $2.type === 'ol'
                    )
                ) {
                    $1[$1.length - 1].value.push(...$2.value);
                } else {
                    $1.push($2);
                }
            }
            $$ = $1;
        }
    | nl-line { $$ = [ $1 ]; }
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
