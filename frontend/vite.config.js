import { defineConfig } from "vite";

export default defineConfig({
    build: {
        target: "esnext",
    },
    assetsInclude: ["**/*.glsl", "**/*.glb"],
});
