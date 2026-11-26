import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function AuthLayout({
  eyebrow,
  title,
  titleEmphasis,
  subtitle,
  children,
  footerPrompt,
  footerLinkText,
  footerLinkTo,
  footerLinkState,
}) {
  return (
    <div className="auth-page">
      <div className="announcement-bar">
        <Sparkles size={13} strokeWidth={1.5} />
        <span>VÉLORA Boutique · Client Concierge</span>
      </div>

      <div className="auth-shell">
        <section className="auth-panel">
          <header className="auth-topbar">
            <Link className="wordmark" to="/" aria-label="Vélora home">
              VÉLORA<span>®</span>
            </Link>
            <Link className="auth-back-link" to="/">
              <ArrowLeft size={14} /> Back to boutique
            </Link>
          </header>

          <main className="auth-main">
            <div className="auth-heading">
              <p className="eyebrow">
                <span /> {eyebrow}
              </p>
              <h1>
                {title} {titleEmphasis && <em>{titleEmphasis}</em>}
              </h1>
              <p className="auth-subtitle">{subtitle}</p>
            </div>

            {children}

            <p className="auth-switch">
              {footerPrompt}{" "}
              <Link className="auth-switch-link" to={footerLinkTo} state={footerLinkState}>
                {footerLinkText}
              </Link>
            </p>
          </main>
        </section>

        <aside className="auth-art" aria-label="Vélora fragrance atelier">
          <img
            src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1400&q=85"
            alt="Perfumer's materials arranged in warm afternoon light"
          />
          <div className="auth-art-wash" />
          <div className="auth-art-caption">
            <span>VÉLORA · GRASSE &amp; PARIS</span>
            <h2>Considered scents, kept just for you.</h2>
            <p>Sign in or join the atelier to save your details for a seamless boutique experience.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
