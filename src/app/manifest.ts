import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "eLiberia - Government services",
    short_name: "eLiberia",
    description: "Apply, pay, verify your identity and receive government documents from home.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F8FC",
    theme_color: "#002868",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
