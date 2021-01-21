# Bison/Jflex modes for CodeMirror

Bring [bison](https://www.gnu.org/software/bison/) (with Java as language) and [JFlex](https://jflex.de) syntax into CodeMirror.

This mode needs the `simplemode` addon and the `clike` mode in order to run properly.

Note: the mode patches `simplemode` and inspects the `clike` context to rely on the brace balance.

Tested on CodeMirror 5.82.2.
