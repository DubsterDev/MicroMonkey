# Building ty, the typechecker

A pre-compiled version of `ty` is already in the repo, but if you need to update it, follow these instructions.

Before beginning, make sure you've installed Rust.

## 1. Clone Ruff

The first step is to clone Ruff, which includes the scripts for the WASM version of ty:

```bash
git clone https://github.com/astral-sh/ruff
```

## 2. Patch typeshed

Delete the typeshed located at `crates/ty_vendored/vendor/typeshed/stdlib`, or rename it.

cd to `crates/ty_vendored/vendor/typeshed/`.

Install the micropython typeshed here instead: 

```bash
pip install -I micropython-esp32-stubs --target stdlib/
```

Inside the stdlib directory, run this python script to get ty to recognize some of the libraries:

```python
import os

files = os.listdir(".")
append_to_versions = ""
for file in files:
    if (file != "stdlib" and not file.startswith("micropython_") and file != "stubs"):
        package_name = file.replace(".pyi", "")
        append_to_versions += f"\n{package_name}: 3.0-"
    
with open("stdlib/VERSIONS", "a") as f:
    f.write(append_to_versions)
```

Then move the contents of stdlib (the one inside stdlib) up one directory.

## 3. Install wasm-pack

cd into the right directory:

```bash
cd ruff/playground/ty
```

We'll have to install `wasm-pack`. This can be done with cargo (note: it will take awhile):

```bash
cargo install wasm-pack
```

## 4. Build the WASM ty

Now, we'll build the WASM build of ty. This will also take a bit of time:

```bash
wasm-pack build ../../crates/ty_wasm --target web --out-dir ../../playground/ty/ty_wasm
```

## 5. Copy the files to the right directories

After it's been built, we need to copy the files to the right directories. First, copy the whole `ty_wasm` directory to MicroMonkey's `core/src`, and remove the `.gitignore` file.

Then, move `ty_wasm_bg.wasm` to the public directory.

## 6. All done!

ty should start working in MicroMonkey now.