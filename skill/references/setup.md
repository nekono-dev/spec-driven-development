# 導入・更新・CI への組み込み

スキル（Claude への手順）と `spec-lint`（検査コマンド）は、別々に配布する。スキルは Claude が使うため環境側に置き、検査は人間・CI・Claude の誰もが同じ結果を得るため、独立したコマンドにしてある。

| | スキル `spec-driven-development` | `spec-lint` |
| --- | --- | --- |
| 利用者 | Claude | 人間・CI・Claude |
| 置き場所 | 環境側（`~/.claude/skills/spec-driven-development`） | npm パッケージ `@nekono-dev/spec-lint`（GitHub Packages） |
| 中身 | SKILL.md・references・templates | 検査スクリプトと依存（mermaid・jsdom・prettier） |

利用側のプロジェクトには、スキルも `spec-lint` の依存も置かない。プロジェクトに残るのは `specs/`・`docs/`・`poc/`・（任意の）`.spec-driven.json` だけである。

## 1. スキルの導入と更新

```sh
git clone git@github.com.nekono:nekono-dev/spec-driven-development.git ~/src/spec-driven-development
ln -s ~/src/spec-driven-development/skill ~/.claude/skills/spec-driven-development
```

更新は、クローンで `git pull --ff-only` を実行する（SKILL.md の「開始時のスキル更新」が、作業の開始時に自動で行う）。

## 2. spec-lint の導入と更新

GitHub Packages は、公開範囲によらず認証が必要である。`read:packages` 権限のトークンを用意し、`~/.npmrc` に書く。

```ini
@nekono-dev:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<トークン>
```

```sh
npm install -g @nekono-dev/spec-lint   # 導入。同じコマンドで最新へ更新する
spec-lint --version
```

Node 22.12 以上が必要である。版は `<メジャー>.<マイナー>.<main への push ごとに増える連番>` で、同じメジャーの中では上位互換を保つ。CI では `@nekono-dev/spec-lint@1` のように範囲を指定して固定する。

`spec-lint` が未導入、または依存が壊れているときは、導入手順を表示して終了コード 1 で止まる（検証を黙って省かない）。

## 3. CI への組み込み

プロジェクトの CI では、スキルを入れずに `spec-lint` だけを実行する（GitHub Actions の例）。

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    registry-url: https://npm.pkg.github.com
    scope: "@nekono-dev"
- run: npx --yes @nekono-dev/spec-lint@1
  env:
    NODE_AUTH_TOKEN: ${{ secrets.SPEC_LINT_TOKEN }} # read:packages 権限のトークン
```

`spec-lint` の終了コードが 0 以外なら、CI を失敗させる。`--json` で機械可読な指摘を得られる。Markdown の整形（prettier）も `spec-lint` が P001 として検査する。プロジェクトの prettier 設定（`.prettierrc`・`.editorconfig`）を使い、コードブロックの中は整形しない。直すには `spec-lint --format [対象]`、整形の検査だけ省くには `--no-format` を付ける。

## 4. spec-lint の開発

このリポジトリの `lint/` で開発する。

```sh
cd lint
npm ci --ignore-scripts
npm test                                           # 自己テスト（全ルール ID のケース網羅を含む）
node bin/spec-lint.mjs --rules > ../skill/references/rules.md   # ルール一覧の再生成
```

ルールを変更する手順は `lint/CONTRIBUTING.md` にある。
