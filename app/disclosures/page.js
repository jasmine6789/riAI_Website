import Link from "next/link";

export const metadata = {
  title: "Disclosures & Risk — riAI",
  description: "Regulatory and risk disclosures. Final wording from compliance.",
};

export default function DisclosuresPage() {
  return (
    <main className="legal-page">
      <h1>Disclosures / Risk Disclaimer</h1>
      <p className="legal-page__lead">
        This is a <strong>placeholder page</strong>. Add SEBI / registration disclosures and risk language approved by
        compliance.
      </p>
      <p>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
