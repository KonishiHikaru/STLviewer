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
ブラウザでの実表示検証は未完了です。
