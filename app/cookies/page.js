import Link from "next/link";

export const metadata = {
  title: "Cookie Policy — riAI",
  description: "How riAI uses cookies.",
};

export default function CookiesPage() {
  return (
    <main className="legal-page">
      <h1>Cookie Policy</h1>
      <p className="legal-page__lead">
        This is a <strong>placeholder page</strong>. Describe essential vs analytics cookies and how consent is stored.
      </p>
      <p>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
