/**
 * 整形チェック: 仕様書の Markdown（specs・docs/architecture・poc の README）が prettier の整形と一致することを検証する。
 *
 * - 表の桁や空行が揃っていないと、差分のたびに無関係な行が変わり、レビューで本文の変更を見分けにくくなる。
 * - 整形は利用側のプロジェクトの prettier 設定（.prettierrc など）に従う。設定がなければ prettier の既定値を使う。
 *   ただしコードブロックの中身は整形しない（設計の疑似コードを、利用側のコードの書式へ合わせないため）。
 * - prettier は spec-lint の依存として一緒に導入される。`spec-lint --format` で対象を整形できる。
 * - コードを含むリポジトリのファイルは対象にしない（検査するのは仕様書の Markdown だけ）。
 */
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { SetupError, finding, runCli, toPosix } from "./lib.mjs"
import { setupProblem } from "./mermaid-syntax.mjs"

export const title = "整形チェック（check-prettier）"

export const rules = {
  P001: "仕様書の Markdown（specs・docs/architecture・poc の README）が prettier の整形と一致する。`spec-lint --format` で整形できる",
}

/** 検査・整形の対象ファイル（絶対パス）。ctx の対象の絞り込みに従う */
export function formatTargets(ctx) {
  const files = []
  for (const spec of ctx.specs) {
    if (!ctx.targets.has(spec.name)) continue
    for (const f of Object.values(spec.files)) files.push(path.resolve(f.rel))
  }
  if (ctx.targetArch) {
    const main = path.join(ctx.repoRoot, "docs", "architecture.md")
    if (fs.existsSync(main)) files.push(main)
    const parts = path.join(ctx.repoRoot, "docs", "architecture")
    if (fs.existsSync(parts))
      for (const e of fs
        .readdirSync(parts, { withFileTypes: true })
        .sort((a, b) => (a.name < b.name ? -1 : 1)))
        if (e.isFile() && e.name.endsWith(".md"))
          files.push(path.join(parts, e.name))
  }
  for (const poc of ctx.docs.pocs) {
    if (!ctx.targetPocs.has(`poc/${poc.name}`)) continue
    const readme = path.join(poc.dir, "README.md")
    if (fs.existsSync(readme)) files.push(readme)
  }
  return files
}

let prettierModule = null
async function loadPrettier() {
  if (prettierModule) return prettierModule
  const problem = setupProblem()
  if (problem) throw new SetupError(problem)
  prettierModule = await import("prettier")
  return prettierModule
}

/** 整形後の本文を返す */
export async function formatted(file, text) {
  const prettier = await loadPrettier()
  const config =
    (await prettier.resolveConfig(file, { editorconfig: true })) ?? {}
  // コードブロックは設計の疑似コードであり、利用側のコードの書式（セミコロンなど）に合わせない
  return prettier.format(text, {
    ...config,
    embeddedLanguageFormatting: "off",
    filepath: file,
  })
}

export async function check(ctx) {
  if (ctx.options.format === false) return []
  const out = []
  for (const file of formatTargets(ctx)) {
    const text = fs.readFileSync(file, "utf8")
    if ((await formatted(file, text)) === text) continue
    out.push(
      finding(
        toPosix(path.relative(process.cwd(), file)),
        1,
        "P001",
        "prettier の整形と一致しない（spec-lint --format で整形できる）",
      ),
    )
  }
  return out
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runCli([{ title, rules, check }])
}
