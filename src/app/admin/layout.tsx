import { fontVars } from "../fonts";
import "../globals.css";

// Page admin : en français, hors des pages publiques /en et /fr.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="fr" className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
