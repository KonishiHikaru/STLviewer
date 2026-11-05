# STL Z Studio
ブラウザ内でSTLを表示し、Z軸倍率を変更するビューアです。

## GitHub Pagesで公開
1. このフォルダの index.html と .nojekyll をリポジトリのルートにアップロードします。
2. Settings → Pages → Build and deployment を開きます。
3. Source: Deploy from a branch、Branch: main、Folder: /(root) を選んで Save します。
4. Pagesの画面に表示されるURLを開きます。

STLファイルはブラウザ内で処理し、アップロードしません。
起動時にThree.jsをCDNから取得します。
倍率変更は表示専用で、元ファイルは変更しません。


## UIとアクセシビリティ
デジタル庁デザインシステムβ版の指針を参照した独自のHTML/CSS実装です（公式コンポーネントパッケージは使用していません）。政府の公式サービスやアクセシビリティ適合認証を意味するものではありません。

- [カラー](https://design.digital.go.jp/dads/foundations/color/): 青を主要操作に使用し、本文は白地に濃い文字。黒と黄色のフォーカス表示。
- [タイポグラフィ](https://design.digital.go.jp/dads/foundations/typography/): 本文16px、補足14px、行高1.7。Noto Sans JPが端末にある場合に使用し、日本語システムフォントにフォールバックします。
- [ボタン](https://design.digital.go.jp/dads/components/button/accessibility/): 48px以上の操作領域、主要／副次操作の区別、視点の選択状態。
- 入力ラベル、範囲説明、入力欄と関連付けたエラー、状態通知、本文スキップリンクを追加。
- 表示領域にフォーカスして矢印キーで回転、＋／−で拡大縮小。視点切替・全体表示ボタンもキーボード操作できます。
- 760px以下は操作パネルとプレビューを縦配置。画面幅の変更時は「倍率に合わせて画面に収める」が有効ならモデルを再調整します。
- index.html と STL-Z-Studio.html は同一内容です。修正時は両方を更新してください。

## 検証
Microsoft Edgeのヘッドレスブラウザーで、サンプル、ASCII/Binary STL、倍率プリセット、入力エラーと復帰、4視点、キーボード操作、不正ファイル時の既存モデル保持、320/390/768/1440px幅の横はみ出しを確認しました。

再実行（Node.jsとMicrosoft Edgeが必要）:

    npm install --no-save playwright
    node tests/browser-smoke.cjs

Three.jsのCDNへ接続できる環境が必要です。手動で全画面、実機タッチ操作、スクリーンリーダーを確認することを推奨します。自動検証だけでWCAG/JISへの完全適合を保証するものではありません。
