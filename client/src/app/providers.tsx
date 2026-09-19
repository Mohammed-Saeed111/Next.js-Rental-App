"use client";

import StoreProvider from "@/state/redux";
import { AuthProvider } from "./(auth)/authProvider";
import Auth from "./(auth)/authProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <AuthProvider>
        <Auth>{children}</Auth>
      </AuthProvider>
    </StoreProvider>
  );
};

export default Providers;
