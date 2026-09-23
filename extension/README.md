# pageOracle browser extension

This directory is a Manifest V3 browser extension.

## Install locally

1. Start the Next.js app (`npm run dev`) or configure the API URL in the extension options.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this `extension` directory.
5. Open a webpage, select text, and click the pageOracle button.

The extension calls `/api/chat` on the configured pageOracle API URL. Configure it from the extension details page under **Extension options**.
