import { defineConfig } from "tsup";

export default defineConfig({
    clean: true,
    target: "esnext",
    format: ["cjs", "esm"],
    entry: ["./src/index.ts"],
    dts: true,
});
