import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — riAI",
  description: "Privacy policy for riAI. Final wording must be reviewed by your compliance officer before launch.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <h1>Privacy Policy</h1>
      <p className="legal-page__lead">
        This is a <strong>placeholder page</strong>. Replace with counsel-reviewed privacy policy before production (per
        your refinement tracker).
      </p>
      <p>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
