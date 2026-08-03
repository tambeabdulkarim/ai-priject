import AnalyticsPanel from '@/components/AnalyticsPanel';
import LocalStorageSync from '@/components/LocalStorageSync';

export default function AnalyticsPage() {
  return (
    <main className="workspace-page">
      <section className="workspace-grid">
        <AnalyticsPanel />
        <LocalStorageSync />
      </section>
    </main>
  );
}
