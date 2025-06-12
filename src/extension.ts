import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const xmindLinkProvider: vscode.DocumentLinkProvider = {
    provideDocumentLinks(document: vscode.TextDocument, _token: vscode.CancellationToken) {
      const links: vscode.DocumentLink[] = [];
      const regex = /\[.*?\]\((.*?\.xmind)\)/g;

      for (let line = 0; line < document.lineCount; line++) {
        const text = document.lineAt(line).text;
        let match;
        while ((match = regex.exec(text))) {
          const linkPath = match[1];
          const start = match.index + match[0].indexOf(linkPath);
          const end = start + linkPath.length;

          const range = new vscode.Range(line, start, line, end);
          const docLink = new vscode.DocumentLink(range);

          // target を設定しないことで resolveDocumentLink を使う
          docLink.tooltip = `XMindで開く: ${linkPath}`;
          links.push(docLink);
        }
      }

      return links;
    },

    async resolveDocumentLink(link: vscode.DocumentLink) {
      const document = vscode.window.activeTextEditor?.document;
      if (!document) {return;}

      const lineText = document.lineAt(link.range.start.line).text;
      const match = /\[.*?\]\((.*?\.xmind)\)/.exec(lineText);
      if (!match) {return;}

      const rawPath = match[1];
      const basePath = path.dirname(document.uri.fsPath);
      const fullPath = path.resolve(basePath, rawPath);

      const platform = process.platform;
      const cmd = platform === 'win32'
        ? `start "" "${fullPath}"`
        : platform === 'darwin'
        ? `open "${fullPath}"`
        : `xdg-open "${fullPath}"`;

      cp.exec(cmd, err => {
        if (err) {
          vscode.window.showErrorMessage(`XMind の起動に失敗しました: ${err.message}`);
        }
      });

      // VSCode にファイルを開かせないように target を設定しない
      link.target = undefined;
      return link;
    }
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider({ language: 'markdown' }, xmindLinkProvider)
  );
}
