import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.LOCALIZATION_AUDIT_PORT || 4173);
const supportedLocales = new Set(['en', 'es', 'pt_PT', 'pt_BR', 'id', 'ja', 'de', 'fr', 'hi', 'vi', 'tr', 'ko', 'zh_CN', 'zh_TW', 'zh_HK']);
const contentTypes = new Map([
    ['.css', 'text/css'], ['.html', 'text/html'], ['.js', 'text/javascript'],
    ['.json', 'application/json'], ['.png', 'image/png'], ['.svg', 'image/svg+xml']
]);

function auditShim(locale, messages) {
    return `<script>
      (() => {
        const messages = ${JSON.stringify(messages)};
        const substitute = (entry, substitutions) => {
          const values = substitutions == null ? [] : Array.isArray(substitutions) ? substitutions : [substitutions];
          let message = entry?.message || '';
          Object.entries(entry?.placeholders || {}).forEach(([name, placeholder]) => {
            const index = Number(placeholder.content.slice(1)) - 1;
            message = message.replaceAll('$' + name + '$', values[index] ?? '');
          });
          return message;
        };
        window.chrome = {
          i18n: { getMessage: (key, substitutions) => substitute(messages[key], substitutions), getUILanguage: () => '${locale.replace('_', '-')}' },
          storage: { sync: {
            get: (_keys, callback) => callback({ customFilters: [{ id: 'audit-filter', title: '', keywords: [], enabled: true }] }),
            set: (_values, callback) => callback?.()
          } },
          tabs: { query: (_query, callback) => callback([]), sendMessage: () => {}, create: () => {} }
        };
      })();
    </script>`;
}

createServer(async (request, response) => {
    try {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const locale = supportedLocales.has(url.searchParams.get('locale')) ? url.searchParams.get('locale') : 'en';
        let relativePath = url.pathname === '/' ? 'popup.html' : url.pathname.slice(1);
        if (relativePath.includes('..')) throw new Error('Invalid path');

        const filePath = path.join(projectRoot, relativePath);
        let body = await readFile(filePath);
        if (relativePath === 'popup.html') {
            const messages = JSON.parse(await readFile(path.join(projectRoot, '_locales', locale, 'messages.json'), 'utf8'));
            body = Buffer.from(body.toString().replace(
                '<script src="popup.js"></script>',
                () => `${auditShim(locale, messages)}\n  <script src="popup.js"></script>`
            ));
        }

        const contentType = contentTypes.get(path.extname(relativePath)) || 'application/octet-stream';
        response.writeHead(200, { 'Content-Type': contentType.startsWith('text/') || contentType === 'application/json' ? `${contentType}; charset=utf-8` : contentType });
        response.end(body);
    } catch (error) {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end(error.message);
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`Localization audit server: http://127.0.0.1:${port}`);
});
