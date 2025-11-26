import { Metadata } from "next";
import BrandingSettings from "./BrandingSettings";

export const metadata: Metadata = {
  title: "Branding - Admin",
  description: "Manage your application's branding, logo, colors, and typography",
};

export default function BrandingPage() {
  return (
    <div className="p-6">
      <BrandingSettings />
    </div>
  );
}
