import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bet ledger",
    short_name: "Bet ledger",
    description: "Your private betting tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7f5",
    theme_color: "#176548",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
