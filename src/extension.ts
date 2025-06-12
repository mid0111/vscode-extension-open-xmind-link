import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const xmindLinkProvider: vscode.DocumentLinkProvider = {
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
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

          const fullPath = path.resolve(path.dirname(document.uri.fsPath), linkPath);
          const encoded = encodeURIComponent(JSON.stringify(fullPath));
          const commandUri = vscode.Uri.parse(`command:OpenXmindLink.fromLink?${encoded}`);

          const docLink = new vscode.DocumentLink(range, commandUri);
          docLink.tooltip = 'XMind で開く';
          links.push(docLink);
        }
      }

      return links;
    }
  };
  
  vscode.commands.registerCommand('OpenXmindLink.fromLink', (filePath: string) => {
    const platform = process.platform;
    const cmd = platform === 'win32'
      ? `start "" "${filePath}"`
      : platform === 'darwin'
      ? `open "${filePath}"`
      : `xdg-open "${filePath}"`;

    cp.exec(cmd, err => {
      if (err) {
        vscode.window.showErrorMessage(`XMind を開けませんでした: ${err.message}`);
      }
    });
  });

  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider({ language: 'markdown' }, xmindLinkProvider)
  );
}
