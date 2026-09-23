import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Objely École",
    short_name: "Objely",
    description: "Borne tactile d'objets perdus et trouvés.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#f6f8fc",
    theme_color: "#f6f8fc",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
