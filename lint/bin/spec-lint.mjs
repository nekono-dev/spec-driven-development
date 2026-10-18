#!/usr/bin/env node
/**
 * 仕様書チェックの一括実行。
 *
 * 使い方: spec-lint [--root specs] [--json] [--rules] [--no-syntax] [--no-format] [--format] [--version] [spec名...]
 * 終了コード: 0=指摘なし / 1=指摘あり・依存の未導入 / 2=引数エラー
 *
 * Mermaid の構文検証（G014）の依存（mermaid・jsdom）は、spec-lint の導入時に一緒に導入される。
 */
import * as structure from "../src/check-structure.mjs"
import * as format from "../src/check-format.mjs"
import * as diagram from "../src/check-diagram.mjs"
import * as wording from "../src/check-wording.mjs"
import * as architecture from "../src/check-architecture.mjs"
import * as poc from "../src/check-poc.mjs"
import * as prettier from "../src/check-prettier.mjs"
import { runCli } from "../src/lib.mjs"
import fs from "node:fs"

if (process.argv.includes("--version")) {
  const pkg = new URL("../package.json", import.meta.url)
  process.stdout.write(JSON.parse(fs.readFileSync(pkg, "utf8")).version + "\n")
  process.exit(0)
}

process.exitCode = await runCli([
  structure,
  format,
  diagram,
  wording,
  architecture,
  poc,
  prettier,
])
