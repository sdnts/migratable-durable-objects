import { MigratableDurableObject } from "./lib";

// The following imports work because of the `[[rules]]` block in wrangler.toml
import v1 from "./migrations/v1-initial.sql";
import v2 from "./migrations/v2-more-columns.sql";

type Env = {
  DEV?: boolean;
  DO: DurableObjectNamespace<ExampleDO>;
};

export class ExampleDO extends MigratableDurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env, { migrations: [v1, v2] });
  }

  async sayHello(): Promise<string> {
    const names = this.ctx.storage.sql.exec("SELECT * FROM names").one();
    return `Hello, ${names.name} (${names.nickname})!`;
  }
}

export default {
  async fetch(_request, env): Promise<Response> {
    const id = env.DO.idFromName("static");
    const stub = env.DO.get(id);

    const greeting = await stub.sayHello();

    return new Response(greeting);
  },
} satisfies ExportedHandler<Env>;
