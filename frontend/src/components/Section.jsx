import { Link } from "react-router-dom";
import "./Section.css";

/**
 * @param {string} title
 * @param {"left"|"center"|"right"} titleAlign
 * @param {{text: string, href: string}} link  (opcional)
 */
export default function Section({ title, titleAlign = "left", link, children }) {
  return (
    <section className="section">
      <div className="section__header">
        <h2 className="section__title" style={{ textAlign: titleAlign }}>{title}</h2>
        {link && <Link className="section__link" to={link.href}>{link.text}</Link>}
      </div>
      {children}
    </section>
  );
}
