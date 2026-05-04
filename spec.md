# 営業・案件・損益管理システム 仕様書

## 概要

顧客獲得から受注・案件実行・損益管理まで、営業活動の全プロセスを一元管理するWebアプリケーション。  
フレームワーク不使用の純粋なHTML/CSS/JSで実装し、データはブラウザのlocalStorageに永続化する。

---

## システム構成

| ファイル | 役割 |
|----------|------|
| `index.html` | UIレイアウト・タブ・モーダルの定義 |
| `style.css` | スタイル定義 |
| `app.js` | データ管理・描画・イベント処理 |

---

## 画面構成（10タブ）

| # | タブ名 | 概要 |
|---|--------|------|
| 1 | ダッシュボード | KPI・パイプライン・目標達成状況のサマリー |
| 2 | 顧客管理 | 顧客マスタのCRUD |
| 3 | 候補案件 | パイプライン管理・ステージ別可視化 |
| 4 | 受注管理 | 受注記録・案件化ボタン |
| 5 | 案件管理 | 実行案件のCRUD・ステータス管理 |
| 6 | 売上管理 | 売上実績の登録・管理 |
| 7 | 原価管理 | 原価実績の登録・カテゴリ管理 |
| 8 | 損益管理 | 部署別/プロジェクト別 P&L レポート |
| 9 | 年度目標 | 年度・部署別の受注高/売上目標と達成率 |
| 10 | 部署管理 | 部署マスタのCRUD |

---

## ビジネスフロー

```
顧客登録
  └─→ 候補案件作成（ステージ・確度管理）
          └─→ [受注確定ボタン] → 受注登録（自動引継ぎ）
                    └─→ [案件化ボタン] → 案件管理（自動引継ぎ）
                              ├─→ 売上実績登録
                              ├─→ 原価実績登録
                              └─→ 損益管理で集計
```

---

## データモデル

### 顧客（customers）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | number | 主キー |
| name | string | 顧客名（必須） |
| industry | string | 業種（IT/製造/金融/流通/建設/サービス/その他） |
| contact | string | 担当者名 |
| tel | string | 電話番号 |
| email | string | メールアドレス |
| note | string | 備考 |
| createdAt | string | 登録日時（ISO8601） |

### 候補案件（prospects）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | number | 主キー |
| customerId | number | 顧客ID（必須） |
| departmentId | number | 部署ID |
| name | string | 案件名（必須） |
| stage | string | ステージ（リード/提案/見積/交渉/クロージング/受注済/失注） |
| probability | number | 成約確度（0〜100%） |
| expectedRevenue | number | 概算金額（円） |
| expectedCost | number | 見込み原価（円） |
| expectedDate | string | 受注見込日 |
| assignee | string | 担当者 |
| note | string | 備考 |
| orderId | number\|null | 受注IDへのリンク（受注確定後に設定） |
| createdAt | string | 登録日時 |

### 受注（orders）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | number | 主キー |
| prospectId | number\|null | 候補案件ID（候補案件から昇格した場合） |
| customerId | number | 顧客ID（必須） |
| departmentId | number | 部署ID |
| name | string | 案件名（必須） |
| orderDate | string | 受注日（必須） |
| revenue | number | 受注金額（必須） |
| expectedCost | number | 見積原価 |
| deliveryDate | string | 納期 |
| assignee | string | 担当者 |
| note | string | 備考 |
| caseId | number\|null | 案件IDへのリンク（案件化後に設定） |
| createdAt | string | 登録日時 |

### 案件（cases）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | number | 主キー |
| orderId | number\|null | 受注IDへのリンク |
| departmentId | number | 部署ID |
| name | string | 案件名（必須） |
| client | string | 顧客名（必須） |
| plannedRevenue | number | 計画売上（円） |
| plannedCost | number | 計画原価（円） |
| status | string | ステータス（新規/進行中/商談中/完了/保留/失注） |
| priority | string | 優先度（高/中/低） |
| assignee | string | 担当者 |
| dueDate | string | 期日 |
| note | string | 備考 |
| createdAt | string | 登録日時 |

### 売上実績（revenues）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | number | 主キー |
| caseId | number | 案件ID（必須） |
| date | string | 売上計上日（必須） |
| amount | number | 金額（円）（必須） |
| note | string | 備考 |

### 原価実績（costs）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | number | 主キー |
| caseId | number | 案件ID（必須） |
| category | string | カテゴリ（人件費/外注費/材料費/経費/その他） |
| date | string | 計上日（必須） |
| amount | number | 金額（円）（必須） |
| note | string | 備考 |

### 年度目標（annualTargets）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | number | 主キー |
| fiscalYear | number | 会計年度（例: 2026） |
| departmentId | number | 部署ID（0 = 全社） |
| orderTarget | number | 受注高目標（円） |
| revenueTarget | number | 売上目標（円） |

> `(fiscalYear, departmentId)` の組み合わせはアプリ側でユニーク保証。

### 部署（depts）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | number | 主キー |
| name | string | 部署名（必須） |
| manager | string | 部署長 |
| note | string | 備考 |

---

## 主要機能仕様

### ダッシュボード

**KPIカード（8枚）**

| カード | 算出方法 |
|--------|---------|
| 売上実績 | revenues 合計 |
| 粗利 | 売上実績 − 原価実績 |
| 粗利率 | 粗利 ÷ 売上実績 × 100 |
| 受注高 | orders 合計 |
| 受注高達成率 | 受注高 ÷ 当年度全社目標 × 100 |
| 売上達成率 | 売上実績 ÷ 当年度全社目標 × 100 |
| パイプライン | 未受注案件の `概算金額 × 確度%` の合計（加重期待値） |
| アクティブ案件 | status が 新規/進行中/商談中 の案件数 |

**パネル（6枚）**

1. パイプライン ステージ別件数・金額（横棒グラフ）
2. 年度目標達成状況（受注高・売上のプログレスバー）
3. 部署別損益サマリー
4. 粗利 TOP5 プロジェクト
5. 最近の売上登録（直近5件）
6. 最近の原価登録（直近5件）

---

### 候補案件タブ

- **パイプラインカード**: リード/提案/見積/交渉/クロージング の5ステージを件数・金額で表示
- **受注確定ボタン**: クリックすると受注モーダルを開き、候補案件の顧客・部署・金額を自動入力
- 保存後、候補案件の `orderId` をセット、`stage` を `受注済` に更新
- フィルタ: 部署 / ステージ / 担当者

---

### 受注管理タブ

- **受注KPI**: 受注高合計 / 未案件化件数 / 案件化済件数
- **案件化ボタン**: `caseId` が null の受注にのみ表示。クリックすると案件モーダルを開き、受注情報を自動入力
- 保存後、`order.caseId` と `case.orderId` を相互にリンク
- フィルタ: 部署 / 年月 / 案件化ステータス

---

### 損益管理タブ

- **部署別ビュー**: 部署を親行（クリックで展開/折りたたみ）、案件を子行として表示
- **プロジェクト別ビュー**: 案件フラット一覧
- 表示列: 計画売上 / 売上実績 / 達成率 / 計画原価 / 原価実績 / 粗利 / 粗利率
- 年フィルタ: 選択年の売上・原価のみ集計

---

### 年度目標タブ

- **全社サマリーセクション**: 受注高・売上のプログレスバー付き実績/目標比較
- **部署別テーブル**: 各部署の受注高/売上について目標額・実績額・達成率（プログレスバー）を表示
- **達成率の色分け**: 100%以上 → 緑 / 70〜99% → 黄 / 70%未満 → 赤
- 年度セレクトで切替（既存目標データから自動生成）

---

## localStorage キー一覧

| キー | 内容 |
|------|------|
| `pm_customers` | 顧客データ配列 |
| `pm_prospects` | 候補案件データ配列 |
| `pm_orders` | 受注データ配列 |
| `pm_targets` | 年度目標データ配列 |
| `pm_depts` | 部署データ配列 |
| `pm_cases` | 案件データ配列 |
| `pm_revenues` | 売上実績データ配列 |
| `pm_costs` | 原価実績データ配列 |
| `pm_*NextId` | 各テーブルの次のID値 |

---

## 動作環境

- モダンブラウザ（Chrome / Firefox / Edge / Safari）
- サーバー不要（ファイルをブラウザで直接開いて動作）
- データはブラウザのlocalStorageに保存（ブラウザをまたいだ共有不可）
