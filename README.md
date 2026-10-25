# spec-driven-development

仕様駆動開発（`specs/<component>/` の 3 点セット、`docs/architecture.md`、PoC）を、検査コマンドで機械的に判定する仕組み。次の 2 つで構成する。

| ディレクトリ | 中身 | 配布 |
| --- | --- | --- |
| [skill/](skill/) | Claude Code スキル（SKILL.md・references・templates）。進め方は [skill/SKILL.md](skill/SKILL.md) | Claude Code プラグイン `spec-driven-development@nekono-dev`（マーケットプレイス [nekono-dev/claude-plugins](https://github.com/nekono-dev/claude-plugins)） |
| [lint/](lint/) | 検査コマンド `spec-lint`（`@nekono-dev/spec-lint`） | GitHub Packages。`main` への push で自動発行する |

スキルは Claude に手順を教え、`spec-lint` は人間・CI・Claude が同じ基準で合否を判定する。利用側のプロジェクトには、スキルも検査コマンドの依存も置かない。`spec-lint` は仕様書の内容に加え、Markdown の整形（prettier。P001）も検査する。

## 導入

スキルはプラグインとして有効にする。自分の環境に入れる場合:

```
/plugin install spec-driven-development --marketplace nekono-dev/claude-plugins
```

リポジトリの `.claude/settings.json` で有効にする場合（チーム・クラウドセッション向け）や CI での使い方は [skill/references/setup.md](skill/references/setup.md) を参照する。

検査コマンドは npm で入れる。

```sh
npm install -g @nekono-dev/spec-lint
```

`@nekono-dev/spec-lint` の取得には GitHub Packages の認証が必要である（[skill/references/setup.md](skill/references/setup.md)）。要件: Node.js 22.12 以上。

## 更新

スキルは、使い始めるときに `claude plugin update spec-driven-development@nekono-dev` で自身を更新する（[skill/SKILL.md](skill/SKILL.md) の「開始時のスキル更新」。反映は再起動後）。`spec-lint` は `npm install -g @nekono-dev/spec-lint` で最新にする。

## 開発

`spec-lint` の開発手順は [lint/CONTRIBUTING.md](lint/CONTRIBUTING.md) を参照する。スキルの開発中の版は `claude --plugin-dir <このリポジトリの clone>` で試す。`plugin.json` に `version` を書かないのは、push のたびにコミットで更新を判定させるためである（書くと、版を上げるまで利用者に更新が届かない）。

このリポジトリには、特定のアプリケーション固有の仕様や例を含めない。
