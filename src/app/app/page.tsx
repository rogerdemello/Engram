import { Providers } from "@/components/Providers";
import { WalletOwnerProvider } from "@/components/owner";
import { Dashboard } from "@/components/Dashboard";

export default function AppPage() {
  return (
    <Providers>
      <WalletOwnerProvider>
        <Dashboard />
      </WalletOwnerProvider>
    </Providers>
  );
}
