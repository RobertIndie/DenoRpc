import Conn = Deno.Conn;
import Listener = Deno.Listener;
import { BufReader, BufWriter } from "https://deno.land/std/io/bufio.ts";
import { Packet, ErrPacket, ErrorType, ReqPacket } from "./packets.ts";
import { WritePacket, ReadPacket } from "./io.ts";
type CallFnType = (req: Packet) => void;

export class Context {
  bufr!: BufReader;
  bufw!: BufWriter;
  constructor(public conn: Conn) {
    this.bufr = new BufReader(conn);
    this.bufw = new BufWriter(conn);
  }
  async Write(packet: Packet) {
    await WritePacket(this.bufw, packet);
  }
  async Read(): Promise<Packet | Deno.EOF> {
    const packet = await ReadPacket(this.bufr);
    return packet;
  }
  async Error(e: ErrorType, msg: string = "") {
    this.Write(new ErrPacket(e, msg));
  }
}

export class RpcServer {
  private closing = false;
  private connections: Map<Conn, Context> = new Map<Conn, Context>();

  constructor(public listener: Listener) {}

  close(): void {
    this.closing = true;
    this.listener.close();
    for (const [conn, context] of this.connections) {
      try {
        conn.close();
      } catch (e) {
        // Connection might have been already closed
        if (!(e instanceof Deno.errors.BadResource)) {
          throw e;
        }
      }
    }
  }

  private services: Map<string, CallFnType> = new Map<string, CallFnType>();

  public Register(method: string, fn: CallFnType): void {
    this.services.set(method, fn);
  }
  public UnRegister(method: string): void {
    this.services.delete(method);
  }

  public Run(): Promise<void> {
    return this.AccpetConn();
  }

  private trackConnection(conn: Conn): void {
    let context = new Context(conn);
    this.connections.set(conn, context);
  }
  private untrackConnection(conn: Conn): void {
    this.connections.delete(conn);
  }

  private async AccpetConn(): Promise<void> {
    if (this.closing) return;
    // Wait for a new connection.
    let conn: Conn;
    try {
      conn = await this.listener.accept();
    } catch (error) {
      if (error instanceof Deno.errors.BadResource) {
        return;
      }
      throw error;
    }
    this.trackConnection(conn);
    this.AccpetConn();
    this.ProcessConn(conn);
  }

  private async ProcessConn(conn: Conn): Promise<void> {
    let req: Packet | Deno.EOF = Deno.EOF;
    let err: Error | undefined;
    const context: Context | undefined = this.connections.get(conn);
    if (context === undefined) return;

    while (!this.closing) {
      try {
        req = await context.Read();
      } catch (e) {
        err = e;
      }
      if (err != null || req === Deno.EOF) {
        break;
      }

      if (req instanceof ReqPacket) {
        if (!this.services.has(req.method)) {
          await context.Error(ErrorType.MethodNotFound);
          continue;
        }
        const r = req;
        new Promise((resolve, reject) => {
          try {
            this.services.get(r.method)?.call(context, r);
            resolve();
          } catch (e) {
            reject(e);
          }
        }).then(() => {}, async (e) => {
          await context.Error(ErrorType.Unhandle, e);
        });
      }
    }

    this.untrackConnection(conn);
    try {
      conn.close();
    } catch (e) {
      // might have been already closed
    }
  }
}
