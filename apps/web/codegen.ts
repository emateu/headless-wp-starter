import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: `${process.env.WORDPRESS_URL ?? "http://localhost:8080"}/graphql`,
  documents: ["src/lib/graphql/documents/**/*.graphql"],
  ignoreNoDocuments: true,
  generates: {
    "src/lib/graphql/__generated__/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        avoidOptionals: false,
        enumsAsTypes: true,
        skipTypename: false,
        dedupeFragments: true,
        documentMode: "string",
        scalars: { ID: "string" },
      },
    },
    "src/lib/graphql/__generated__/schema.graphql": {
      plugins: ["schema-ast"],
    },
  },
};

export default config;
