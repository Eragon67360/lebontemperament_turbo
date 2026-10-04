import { RosterSyncReview } from "@/components/users/sync/RosterSyncReview";

// Synchronisation de la liste des membres (#462): vérifier, choisir,
// appliquer. The dashboard layout already requires an admin session.
export default function UsersSyncPage() {
  return <RosterSyncReview />;
}
