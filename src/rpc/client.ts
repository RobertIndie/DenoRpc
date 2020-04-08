import { ReqPacket, ResPacket } from "./packets.ts";
import { Context } from "./server.ts";

export class RpcClient {
  private closing = false;
  public context: Context = new Context(this.conn);
  constructor(public conn: Deno.Conn) {}
  Close(): void {
    this.closing = true;
    try {
      this.conn.close();
    } catch (e) {
      // Connection might have been alread closed.
      if (!(e instanceof Deno.errors.BadResource)) {
        throw e;
      }
    }
  }
  async Call(
    method: string,
    req: object,
    hasReturn: boolean = true,
  ): Promise<object | void> {
    if (this.closing) {
      throw new Error("Client is closed.");
    }
    const reqPacket = new ReqPacket();
    reqPacket.method = method;
    reqPacket.payload = JSON.stringify(req);
    await this.context.Write(reqPacket);
    if (hasReturn) {
      const res = await this.context.Read();
      if(res === Deno.EOF)throw new Error("Read error.");
      if(res instanceof ResPacket){
        const obj = JSON.parse(res.payload);
        return obj;
      }
      throw new Error("Unknown packet.");
    }
    return;
  }
}

export async function connect(
  addr: string | Deno.ListenOptions,
): Promise<RpcClient> {
  if (typeof addr === "string") {
    const [hostname, port] = addr.split(":");
    addr = { hostname, port: Number(port) };
  }

  const conn = await Deno.connect(addr);
  return new RpcClient(conn);
}
