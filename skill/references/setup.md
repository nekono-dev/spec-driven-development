# 導入・更新・CI への組み込み

スキル（Claude への手順）と `spec-lint`（検査コマンド）は、別々に配布する。スキルは Claude が使うためプラグインとして配り、検査は人間・CI・Claude の誰もが同じ結果を得るため、独立したコマンドにしてある。

| | スキル `spec-driven-development` | `spec-lint` |
| --- | --- | --- |
| 利用者 | Claude | 人間・CI・Claude |
| 置き場所 | Claude Code プラグイン `spec-driven-development@nekono-dev` | npm パッケージ `@nekono-dev/spec-lint`（GitHub Packages） |
| 中身 | SKILL.md・references・templates | 検査スクリプトと依存（mermaid・jsdom・prettier） |

利用側のプロジェクトには、スキルも `spec-lint` の依存も置かない。プロジェクトに残るのは `specs/`・`docs/`・`poc/`・（任意の）`.spec-driven.json` だけである。

## 1. スキルの導入と更新

スキルは Claude Code のプラグインとして配布する。マーケットプレイスは `nekono-dev`（リポジトリ `nekono-dev/claude-plugins`）で、`branch-release-workflow` と同じ一覧に載っている。どれか 1 つでよい。settings.json を変える場合は、変更内容を利用者に示して承認を得てから書く。

### リポジトリで有効にする（チーム・クラウドセッション向け）

リポジトリの `.claude/settings.json` に入れて commit する。リポジトリを開いた人とクラウドセッションに、このプラグインが入る。

```json
{
  "extraKnownMarketplaces": {
    "nekono-dev": { "source": { "source": "github", "repo": "nekono-dev/claude-plugins" } }
  },
  "enabledPlugins": { "spec-driven-development@nekono-dev": true }
}
```

すでに `nekono-dev` を登録している場合は、`enabledPlugins` に 1 行足すだけでよい。

### 自分の環境で有効にする

```
/plugin install spec-driven-development --marketplace nekono-dev/claude-plugins
```

### 更新

```sh
claude plugin marketplace update nekono-dev
claude plugin update spec-driven-development@nekono-dev   # 反映は再起動後
```

SKILL.md の「開始時のスキル更新」が、作業の開始時にこれを行う。

### CI で使う

CI で Claude に仕様書を書かせる場合だけ要る。検査だけなら 3 章のとおりスキルは要らない。GitHub Actions の `anthropics/claude-code-action` では入力で指定する。

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    plugin_marketplaces: https://github.com/nekono-dev/claude-plugins.git
    plugins: spec-driven-development@nekono-dev
```

それ以外の CI では、clone したディレクトリを `--plugin-dir` で読み込む。

```sh
git clone --depth 1 https://github.com/nekono-dev/spec-driven-development.git "$RUNNER_TEMP/sdd"
claude -p "..." --plugin-dir "$RUNNER_TEMP/sdd"
```

### 開発中の版を試す

```sh
claude --plugin-dir <このリポジトリの clone>
```

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

### SPEC_LINT_TOKEN の登録

`secrets.SPEC_LINT_TOKEN` は、`skill/scripts/register-token.sh` が `gh secret set` でカレントリポジトリの Actions Secret に登録する。SKILL.md の「開始時のトークン登録」が、作業の開始時に呼ぶ。人間が直接実行してもよい（`--force` で登録済みを上書きする）。

| 項目 | 内容 |
| --- | --- |
| 読み込み元（上が優先） | リポジトリ直下の `.env`（`.gitignore` で無視されていること）、`~/.config/spec-driven/env`（全プロジェクト共通） |
| 書式 | `SPEC_LINT_TOKEN=<read:packages 権限のトークン>`（1 行） |
| 終了コード | 0=登録済み／3=トークン未設定／1=その他の失敗 |

- `.env` が `.gitignore` で無視されていなければ、漏えいを避けるため読まない（共通ファイルへ進む）。
- ファイルは `source` せず、該当の 1 行だけを取り出す。トークンは標準入力で `gh` に渡し、画面にも出さない。
- 登録には、`gh auth login` 済みで、リポジトリの Secret を書ける権限が要る。

## 4. spec-lint の開発

このリポジトリの `lint/` で開発する。

```sh
cd lint
npm ci --ignore-scripts
npm test                                           # 自己テスト（全ルール ID のケース網羅を含む）
node bin/spec-lint.mjs --rules > ../skill/references/rules.md   # ルール一覧の再生成
```

ルールを変更する手順は `lint/CONTRIBUTING.md` にある。
