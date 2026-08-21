import { useSession } from "../../lib/auth";
import { AdminLogin } from "./AdminLogin";
import { AdminHome } from "./AdminHome";

export function Admin() {
  const { session, loading, isAdmin } = useSession();

  if (loading) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20">
        <div className="pb-skeleton h-8 w-2/3" />
        <div className="pb-skeleton mt-3 h-10 w-full" />
      </div>
    );
  }
  if (!session) return <AdminLogin />;
  if (!isAdmin) return <p className="p-6 text-text-dim">Signed in as {session.user.email}, but that's not the admin account.</p>;
  return <AdminHome />;
}
