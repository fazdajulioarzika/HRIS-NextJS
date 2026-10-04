import { vi } from "vitest";

export function createSupabaseMock() {
  const queue: Record<string, any[]> = {};

  function key(table: string, op: string) {
    return `${table}:${op}`;
  }

  function push(table: string, op: string, result: any) {
    const k = key(table, op);
    queue[k] = queue[k] ?? [];
    queue[k].push(result);
  }

  function consume(table: string, op: string) {
    const k = key(table, op);
    const arr = queue[k];
    if (!arr || arr.length === 0) {
      throw new Error(
        `Tidak ada mock response untuk ${k}. Tambahkan lewat push().`
      );
    }
    return arr.shift();
  }

  const client: any = {
    auth: { getUser: vi.fn() },
    from(table: string) {
      const state: any = { op: undefined };

      const builder: any = {
        select: () => {
          state.op = state.op ?? "select";
          return builder;
        },
        insert: (payload: any) => {
          state.op = "insert";
          state.payload = payload;
          return builder;
        },
        update: (payload: any) => {
          state.op = "update";
          state.payload = payload;
          return builder;
        },
        upsert: (payload: any, _opts?: any) => {
          state.op = "upsert";
          state.payload = payload;
          return builder;
        }, // tambahan
        delete: () => {
          state.op = "delete";
          return builder;
        },
        eq: () => builder,
        neq: () => builder,
        gte: () => builder,
        lte: () => builder,
        in: () => builder,
        order: () => builder,
        limit: () => builder,
        single: () => builder,
        maybeSingle: () => builder,
        // Membuat builder jadi "thenable" — supaya `await builder` jalan normal,
        // persis seperti cara kerja asli @supabase/supabase-js
        then(onFulfilled: any, onRejected: any) {
          const result = consume(table, state.op ?? "select");
          return Promise.resolve(result).then(onFulfilled, onRejected);
        },
      };

      return builder;
    },
  };

  return { client, push };
}
