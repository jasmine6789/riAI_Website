import Link from "next/link";

export const metadata = {
  title: "Terms of Use — riAI",
  description: "Terms of use for riAI. Final wording must be reviewed by legal before launch.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <h1>Terms of Use</h1>
      <p className="legal-page__lead">
        This is a <strong>placeholder page</strong>. Replace with approved terms before production.
      </p>
      <p>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
