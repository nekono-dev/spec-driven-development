# spec-lint の開発

## 構成

```
lint/
├── bin/spec-lint.mjs        # 一括実行の入口（コマンド spec-lint）
├── src/
│   ├── check-structure.mjs     # S系: ディレクトリ構成・spec 間の独立性・architecture と spec／PoC／くくりの文書の突合
│   ├── check-format.mjs        # F系: 雛形どおりの体裁・ID・トレーサビリティ・サイズ上限
│   ├── check-diagram.mjs       # G系: 関係図・ワークフロー図（mermaid）の構造と、構成表・設計項目との対応
│   ├── check-wording.mjs       # W系: 規定にそぐわない語・表現（spec・architecture・PoC）
│   ├── check-architecture.mjs  # F-A系: docs/architecture.md とくくりの文書の章立て・表と図の対応・機能の関与・くくり間の依存
│   ├── check-poc.mjs           # F-P系: poc/<テーマ>/README.md の体裁と結論・結果の整合
│   ├── docs-model.mjs          # architecture・PoC の文書モデル（各チェックと --status が共有）
│   ├── commands.mjs            # --status／--retarget-poc／--check-poc-committed／--show-config
│   ├── mermaid-syntax.mjs      # 図の構文検証（G014）。依存の導入状態の確認と mermaid.parse の呼び出し
│   └── lib.mjs                 # 共通処理と CLI 本体
└── test/                    # 自己テスト（雛形は ../skill/templates を使う）
```

## 依存

外部パッケージは、図の構文検証（G014）が mermaid・jsdom を、整形の検査（P001、`check-prettier.mjs`）が prettier を使う。`package.json` の版は完全固定する（`^` `~` を付けない）。版を変えるときは `npm install --ignore-scripts` でロックファイルを更新し、`npm test` を通す。`--no-syntax` は G014 を省くオプションで、自己テスト専用である。

## ルールの変更

次をすべて同じ変更で行う。

1. `src/check-*.mjs` の `rules` 定義と判定処理を変更する。
2. `test/selftest.mjs`（spec 用）または `test/selftest-docs.mjs`（architecture・PoC 用）に、そのルールが発火するケースを追加する（全ルール ID のケース網羅はテストで強制される）。
3. `node bin/spec-lint.mjs --rules > ../skill/references/rules.md` で一覧を再生成する。
4. 雛形（`../skill/templates`）を変えた場合も含め、依存を導入した状態で `npm test` が成功することを確認する。

## 発行

`main` ブランチへ `lint/` の変更が push されると、`.github/workflows/publish.yml` が自己テストを通した上で GitHub Packages へ発行する。版の連番は CI が付けるため、`package.json` の版はメジャー・マイナーを変えるときだけ編集する。
