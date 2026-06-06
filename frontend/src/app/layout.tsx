import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "NutritionAI",
  description: "Precision nutrition tracking powered by AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#0d1117",
              color: "#f1f5f9",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              fontSize: "13px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            },
          }}
        />
      </body>
    </html>
  );
}
