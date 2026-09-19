const features = [
  {
    title: 'Select any text',
    text: 'Highlight a paragraph or sentence on any webpage and push it into your reading context.',
  },
  {
    title: 'Ask AI anything',
    text: 'Summarize, explain, translate, or compare what you selected without leaving the page.',
  },
  {
    title: 'Learn faster',
    text: 'Turn complex content into digestible explanations, action points, and follow-up questions.',
  },
];

const examples = [
  'Explain this in simpler words',
  'What are the key takeaways?',
  'Give me 3 action items from this text',
  'Turn this into a summary for my team',
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="badge">AI reading companion</span>
          <h1>Understand any page with a single highlight.</h1>
          <p>
            pageOracle helps you select text from any website and instantly ask AI to explain,
            summarize, and contextualize it.
          </p>

          <div className="cta-row">
            <button className="primary">Try demo</button>
            <button className="secondary">View roadmap</button>
          </div>

          <div className="mini-stats">
            <div>
              <strong>5s</strong>
              <span>average answer time</span>
            </div>
            <div>
              <strong>∞</strong>
              <span>webpage contexts</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>AI helper</span>
            </div>
          </div>
        </div>

        <div className="mockup">
          <div className="browser-bar">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>

          <div className="article-card">
            <p className="selection">
              “The most effective teams don’t just ship faster — they convert knowledge into action
              at every stage of the product lifecycle.”
            </p>
          </div>

          <div className="chat-card">
            <div className="chat-row incoming">
              <span>What does this mean for a startup?</span>
            </div>
            <div className="chat-row outgoing">
              <span>It suggests focusing on fast learning loops and turning insights into daily shipping decisions.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

      <section className="prompt-panel">
        <div className="panel-header">
          <span>Suggested prompts</span>
        </div>
        <div className="prompt-grid">
          {examples.map((example) => (
            <button key={example}>{example}</button>
          ))}
        </div>
      </section>
    </main>
  );
}
