# migratable-durable-objects

A tiny migration engine for SQLite Durable Objects

### Usage

1. Add this to your `wrangler.toml` to allow importing `.sql` files as strings:
```toml
[[rules]]
type = "Text"
globs = ["**/*.sql"]
fallthrough = true
```

2. `extend` your Durable Object class from `MigratableDurableObject` instead of the in-built
`DurableObject` class from `@cloudflare/workers-types`. You can then pass in migrations
you'd like to apply in the third argument. 

[`src/index.ts`](src/index.ts) is an example Worker that will be helpful to read
to understand the vision.

For this example Worker, I put up all my migrations in `.sql` files in the `src/migrations`
folder, but really they could be placed anywhere you want.

