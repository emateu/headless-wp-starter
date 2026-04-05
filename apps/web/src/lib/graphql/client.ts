import { GraphQLClient } from "graphql-request";

const endpoint = `${process.env.WORDPRESS_URL ?? "http://localhost:8080"}/graphql`;

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    "Content-Type": "application/json",
  },
  responseMiddleware: (response) => {
    if (response instanceof Error) {
      console.error("[GraphQL]", response.message);
    }
  },
});

/**
 * Authenticated GraphQL client for preview/draft mode requests.
 * Uses WordPress Application Password (base64-encoded username:password).
 */
export const authGraphqlClient = new GraphQLClient(endpoint, {
  headers: {
    "Content-Type": "application/json",
    ...(process.env.WORDPRESS_AUTH_TOKEN
      ? { Authorization: `Basic ${process.env.WORDPRESS_AUTH_TOKEN}` }
      : {}),
  },
});
