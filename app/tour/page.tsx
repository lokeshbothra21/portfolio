import type { Metadata } from "next";
import { TourLoader } from "@/components/TourLoader";
import { profile } from "@/content/content";

export const metadata: Metadata = {
  title: `3D tour · ${profile.name}`,
  description: `Build ${profile.name}'s AI projects brick by brick in an interactive 3D instruction booklet.`,
};

export default function TourPage() {
  return <TourLoader />;
}
