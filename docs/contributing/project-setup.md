# Project Setup

> [!NOTE] This is dev setup
> This guide describes setup if you want to modify or improve the plugin's code. If you want to use plugin in your Obsidian, this is not the guide you're looking for!

To setup project on your computer you need usual web dev setup:
- Git
- Node
- pnpm

The project is written in TypeScript.

## Initial setup
To clone the project:
```bash
git clone git@github.com:h-sphere/sql-seal.git
```

Then you can install dependencies:
```bash
pnpm install
```

You can run tests to double check if everything worked fine:
```bash
pnpm test
```
If you see green checks, you're ready to go.

## Compiling the project
To compile the project simply run:
```bash
pnpm build
```
This should compile typescript (and wasm) files into single `main.js` file. For now there is no watch mode so every time you test, rebuild the project and refresh the Vault.

To refresh the vault: `CMD + P` (palette) and `Reload app without saving`


## Using SQLSeal in your (test) vault
The best way to develop SQLSeal is to link it in your test vault so you can easily reload it and see the changes. You can either clone the repository into the plugins folder of your obsidian (`.obsidian/plugins`) or create a symlink:
```bash
ln -s ../cloned-location sqlseal
```

