import { DurableObject } from "cloudflare:workers";

const metaMigration = `
  CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

export class MigratableDurableObject<
  Env extends { DEV?: boolean },
> extends DurableObject {
  constructor(
    ctx: DurableObjectState,
    env: Env,
    { migrations = [] }: { migrations: string[] },
  ) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(metaMigration);

      const appliedMigrations = ctx.storage.sql
        .exec<{ version: number; applied_at: string }>(
          "SELECT * FROM _migrations",
        )
        .toArray();

      for (const [version, migration] of migrations.entries()) {
        if (appliedMigrations.find((m) => m.version === version)) {
          console.info(`[mdo] Skipping migration v${version}, already applied`);
          continue;
        }

        let bookmark: string | undefined = undefined;
        if (!env.DEV) bookmark = await ctx.storage.getCurrentBookmark();

        try {
          console.info(`[mdo] Applying migration v${version}`);

          ctx.storage.sql.exec(migration);
          ctx.storage.sql.exec(
            "INSERT INTO _migrations (version) VALUES (?1)",
            version,
          );
        } catch (e) {
          console.error(`[mdo] Failed applying migration v${version}`, e);
          if (!env.DEV && bookmark)
            await ctx.storage.onNextSessionRestoreBookmark(bookmark);

          ctx.abort();
        }
      }

      console.info("[mdo] Ready to accept queries");
    });
  }
}
