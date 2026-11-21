// Shared dependency-cruiser rules. Use it from the repo's .dependency-cruiser.cjs:
//   module.exports = {
//     extends: "@ozymandiasvc/lint-config/depcruise",
//     forbidden: [ /* this repo's layer rules */ ],
//     options: { tsConfig: { fileName: "tsconfig.json" } },
//   };

/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Circular imports. Move the shared code into a module both sides import.",
      from: {},
      to: {
        circular: true,
        // A cycle made only of `import type` edges is erased at compile time.
        viaOnly: { dependencyTypesNot: ["type-only"] },
      },
    },
    {
      name: "no-orphans",
      severity: "error",
      comment:
        "A file nothing imports. Delete it, or import it from where it is used.",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$",
          "[.]d[.][cm]?ts$",
          "(^|/)tsconfig[.]json$",
          "(^|/)[^/]+[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$",
        ],
      },
      to: {},
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment:
        "An import that does not resolve. Fix the path or add the package.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-non-package-json",
      severity: "error",
      comment:
        "An import of a package that package.json does not declare. Add it to dependencies.",
      from: {},
      to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] },
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment:
        "Production code imports a devDependency. Move it to dependencies, or keep the import in test or config code.",
      from: {
        path: "(^|/)src/",
        pathNot: [
          "[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$",
          "[.]d[.][cm]?ts$",
        ],
      },
      to: {
        dependencyTypes: ["npm-dev"],
        dependencyTypesNot: ["type-only"],
        pathNot: ["node_modules/@types/"],
      },
    },
    {
      name: "no-package-internals",
      severity: "error",
      comment:
        "A workspace package imports another package's internals. Import from that package's public entry (its index) instead.",
      from: { path: "^(apps|packages)/([^/]+)/" },
      to: {
        path: "^packages/[^/]+/src/.+",
        pathNot: ["^packages/$2/", "^packages/[^/]+/src/index[.][cm]?[jt]sx?$"],
      },
    },
  ],
  options: {
    doNotFollow: { path: ["node_modules"] },
    exclude: { path: ["(^|/)(?:dist|build|coverage|[.]next)/"] },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
    skipAnalysisNotInRules: true,
  },
};
