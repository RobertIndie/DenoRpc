import Conn = Deno.Conn;
import Listener = Deno.Listener;
import { BufReader, BufWriter } from "https://deno.land/std/io/bufio.ts";
import { Packet } from "./packets.ts";

type CallFnType = (req: Object) => Context;

export class Context {
  bufr!: BufReader;
  bufw!: BufWriter;
  constructor(public conn: Conn) {
    this.bufr = new BufReader(conn);
    this.bufw = new BufWriter(conn);
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
    this.services.set(method,fn);
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

  private async Write(conn: Conn) {
  }
  private async Read(conn: Conn): Promise<Packet|Deno.EOF> {
    return Deno.EOF;
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
    let req: Packet|Deno.EOF = Deno.EOF;
    let err: Error | undefined;

    while (!this.closing) {
      try {
        req = await this.Read(conn);
      } catch (e) {
        err = e;
      }
      if (err != null || req === Deno.EOF) {
        break;
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
