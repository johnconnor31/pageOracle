export const metadata = {
  title: 'pageOracle',
  description: 'Select text on any webpage and ask AI what it means.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
