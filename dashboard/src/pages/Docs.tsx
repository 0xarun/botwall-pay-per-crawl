import React, { useState } from 'react';

const sections = [
  {
    id: 'overview',
    label: 'Overview',
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">What is BotWall?</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          <b>BotWall</b> is an open-source pay-per-crawl system that lets site owners monetize their content and lets bot developers access protected data ethically. It uses Ed25519 cryptographic signatures for bot authentication and a credit-based payment model for API access.
        </p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
          <li>Site owners protect their APIs with a single line of middleware.</li>
          <li>Bots must sign requests and pay per crawl using credits.</li>
          <li>Payments and credits are managed via a robust backend and dashboard.</li>
        </ul>
        <div className="text-xs text-muted-foreground">
          <b>Learn more:</b> See the SDK and middleware READMEs for advanced usage.
        </div>
      </div>
    )
  },
  {
    id: 'publisher-middleware',
    label: 'For Site Owners: Middleware',
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">Protect Your API with Middleware</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Secure your API routes and monetize bot access with a single line of code:
        </p>
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-1">Install Middleware</div>
          <pre className="bg-gray-900 text-white p-4 rounded mb-2 text-xs">npm install @botwall/middleware</pre>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-1">Usage Example</div>
          <pre className="bg-gray-100 dark:bg-gray-800 text-xs p-3 rounded overflow-x-auto">
{`const { validateCrawlRequest } = require('@botwall/middleware');

app.use('/api', validateCrawlRequest);
`}
          </pre>
        </div>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
          <li>No credentials or secrets needed.</li>
          <li>Only verified, credit-holding bots can access protected routes.</li>
          <li>All requests are cryptographically signed and logged.</li>
        </ul>
        <div className="text-xs text-muted-foreground">
          <b>Tip:</b> See the <a href="/packages/middleware/README.md" className="underline">middleware README</a> for advanced options.
        </div>
      </div>
    )
  },
  {
    id: 'bot-sdk',
    label: 'For Bot Developers: SDK',
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">Access Protected Data with the SDK</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Use the BotWall SDK to sign and send crawl requests, manage credits, and interact with the API:
        </p>
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-1">Install SDK</div>
          <pre className="bg-gray-900 text-white p-4 rounded mb-2 text-xs">npm install @botwall/sdk</pre>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-1">Send a Signed Crawl Request</div>
          <pre className="bg-gray-100 dark:bg-gray-800 text-xs p-3 rounded overflow-x-auto">
{`import { sendCrawlRequest } from '@botwall/sdk';

const headers = {
  'crawler-id': 'mybot.com',
  'crawler-max-price': '0.05',
  'signature-input': 'host path',
  'host': 'example.com',
  'path': '/api/data',
};
const privateKey = '...'; // Your Ed25519 private key (base64)
const response = await sendCrawlRequest('https://example.com/api/data', headers, privateKey);
const data = await response.json();
console.log(data);
`}
          </pre>
        </div>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
          <li>Get your private key when registering your bot (keep it safe!).</li>
          <li>Credits are deducted automatically per successful crawl.</li>
        </ul>
        <div className="text-xs text-muted-foreground">
          <b>Advanced:</b> See the <a href="/packages/sdk/README.md" className="underline">SDK README</a> for keypair generation, manual signing, and more.
        </div>
      </div>
    )
  },
  {
    id: 'payments-credits',
    label: 'Payments & Credits',
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">Payments & Credits</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          BotWall uses a credit-based system. Bots need credits to crawl protected endpoints. Each successful crawl deducts 1 credit.
        </p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
          <li>Buy credits via the dashboard or API (supports real and mock/test payments).</li>
          <li>Site owners earn money based on their price per crawl and successful crawls.</li>
          <li>All payments and credits are tracked in the backend and visible in analytics.</li>
        </ul>
        <div className="text-xs text-muted-foreground">
          <b>See also:</b> Payments & Credits section in the main README for full details.
        </div>
      </div>
    )
  },
  {
    id: 'faq',
    label: 'FAQ & Help',
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">FAQ & Help</h2>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
          <li>For SDK usage, see the <a href="/packages/sdk/README.md" className="underline">SDK README</a>.</li>
          <li>For middleware usage, see the <a href="/packages/middleware/README.md" className="underline">middleware README</a>.</li>
          <li>For backend/API docs, see the main <a href="/README.md" className="underline">README</a>.</li>
          <li>Open an issue or discussion on GitHub for questions or support.</li>
        </ul>
        <div className="text-xs text-muted-foreground">
          Maintained by Arun — <a href="https://x.com/0xarun" className="underline">x.com/0xarun</a> | <a href="https://linkedin.com/in/0xarun" className="underline">linkedin.com/in/0xarun</a>
        </div>
      </div>
    )
  }
];

export default function Docs() {
  const [active, setActive] = useState(sections[0].id);
  return (
    <div className="flex max-w-5xl mx-auto p-8 gap-8">
      <aside className="w-64 flex-shrink-0">
        <nav className="sticky top-24 space-y-2">
          {sections.map(section => (
            <button
              key={section.id}
              className={`block w-full text-left px-4 py-2 rounded font-medium transition-colors ${active === section.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'hover:bg-muted text-gray-700 dark:text-gray-200'}`}
              onClick={() => setActive(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        {sections.find(section => section.id === active)?.content}
      </main>
    </div>
  );
}