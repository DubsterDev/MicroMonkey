# Tutorial: Build ty, the type checker

Before beginning, make sure you've installed Rust.

## 1. Clone Ruff

The first step is to clone Ruff, which includes the scripts for the WASM version of ty:

`git clone https://github.com/astral-sh/ruff`

Then, cd into the right directory:

`cd ruff/playground/ty`

## 2. Install wasm-pack

Next, we'll have to install `wasm-pack`. This can be done with cargo (note: it will take awhile):
`cargo install wasm-pack`

## 3. Build the WASM ty

Now, we'll build the WASM build of ty. This will also take a bit of time:
`wasm-pack build ../../crates/ty_wasm --target web --out-dir ../../playground/ty/ty_wasm`

## 4. Copy the files to the right directories

After it's been built, we need to copy the files to the right directories. First, copy the whole `ty_wasm` directory to MicroMonkey's `core/src`, and remove the `.gitignore` file.

Then, move `ty_wasm_bg.wasm` to the public directory.

## 5. All done!

ty should start working in MicroMonkey now.