import { useSession } from "../../lib/auth";
import { AdminLogin } from "./AdminLogin";
import { AdminHome } from "./AdminHome";

export function Admin() {
  const { session, loading, isAdmin } = useSession();

  if (loading) return <p className="p-6 text-text-dim">Loading…</p>;
  if (!session) return <AdminLogin />;
  if (!isAdmin) return <p className="p-6 text-text-dim">Signed in as {session.user.email}, but that's not the admin account.</p>;
  return <AdminHome />;
}
