# Using Intellisense

MicroMonkey uses [ty](https://github.com/astral-sh/ty/) to provide autocompletions and syntax checking. Autocompletions are always enabled, but syntax checking can be disabled in the settings page.

Ty only knows the contents of files currently open in MicroMonkey and built-in MicroPython modules, so if you want code completions and docs for `import`s, you'll have to open the corresponding file in the editor.