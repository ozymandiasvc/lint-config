// Shared knip settings. Use it from the repo's knip.config.js:
//   import base from "@ozymandiasvc/lint-config/knip";
//   export default { ...base, workspaces: { ... } };
// knip finds entry files through its plugins, so the base holds only policy.

/** @type {import("knip").KnipConfig} */
const config = {
  ignoreExportsUsedInFile: true,
  rules: {
    files: "error",
    dependencies: "error",
    devDependencies: "error",
    optionalPeerDependencies: "error",
    unlisted: "error",
    binaries: "error",
    unresolved: "error",
    exports: "error",
    types: "error",
    nsExports: "error",
    nsTypes: "error",
    duplicates: "error",
    enumMembers: "error",
  },
};

export default config;
