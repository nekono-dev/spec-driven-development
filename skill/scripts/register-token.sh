#!/usr/bin/env bash
# SPEC_LINT_TOKEN を、カレントリポジトリの Actions Secret へ gh で登録する。
#
# トークンは、次の環境設定ファイルから読む（上が優先。どちらか一方にあればよい）。
#   1. <リポジトリ直下>/.env          （git で無視されていること）
#   2. ~/.config/spec-driven/env      （全プロジェクト共通）
# 書式は `SPEC_LINT_TOKEN=<トークン>`（`export ` 接頭辞と引用符は許容）。
# ファイルは source せず、該当の1行だけを取り出す（任意コードを実行しないため）。
#
# 終了コード: 0=登録済み（今回登録した場合を含む）／3=トークン未設定（利用者にファイル配置を依頼する）／1=その他の失敗
# トークンの値は、画面にもログにも出さない。
#
# 使い方: register-token.sh [--force]   --force は登録済みでも上書きする
set -euo pipefail

NAME=SPEC_LINT_TOKEN
GLOBAL_ENV="${XDG_CONFIG_HOME:-$HOME/.config}/spec-driven/env"
force=0
[ "${1:-}" = "--force" ] && force=1

# ファイルから SPEC_LINT_TOKEN の値を取り出す（無ければ空）
read_token() {
  local line
  line=$(grep -E "^[[:space:]]*(export[[:space:]]+)?${NAME}=" "$1" | tail -n 1) || true
  line=${line#*=}
  line=${line%$'\r'}
  # 前後の空白と、囲んでいる引用符を外す
  line=$(printf '%s' "$line" | sed -E "s/^[[:space:]]+//; s/[[:space:]]+$//; s/^(\"(.*)\"|'(.*)')$/\2\3/")
  printf '%s' "$line"
}

command -v gh >/dev/null || { echo "gh が見つからない。GitHub CLI を導入し、gh auth login を済ませること。" >&2; exit 1; }
root=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "git リポジトリの中で実行すること。" >&2; exit 1; }

token="" source_file=""
project_env="$root/.env"
if [ -f "$project_env" ]; then
  # 無視されていない .env は、コミットで漏えいし得るため使わない
  if git -C "$root" check-ignore -q .env; then
    token=$(read_token "$project_env")
    [ -n "$token" ] && source_file=$project_env
  else
    echo "警告: $project_env は .gitignore で無視されていないため、読まない。" >&2
  fi
fi
if [ -z "$token" ] && [ -f "$GLOBAL_ENV" ]; then
  token=$(read_token "$GLOBAL_ENV")
  [ -n "$token" ] && source_file=$GLOBAL_ENV
fi

if [ -z "$token" ]; then
  cat >&2 <<MSG
${NAME} が未設定。次のどちらかのファイルに、1行で配置すること。
  ${project_env}（.gitignore で無視されていること）
  ${GLOBAL_ENV}（全プロジェクト共通）
書式: ${NAME}=<read:packages 権限のトークン>
MSG
  exit 3
fi

if [ "$force" -eq 0 ] && gh secret list --app actions | cut -f1 | grep -qx "$NAME"; then
  echo "${NAME} は登録済み。何もしない（上書きは --force）。"
  exit 0
fi

printf '%s' "$token" | gh secret set "$NAME" --app actions
echo "${NAME} を Actions Secret に登録した（読み込み元: ${source_file}）。"
