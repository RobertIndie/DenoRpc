import { BufReader } from "https://deno.land/std/io/bufio.ts";
import { TextProtoReader } from "https://deno.land/std/textproto/mod.ts";
import { ReqPacket } from "./server.ts";

export enum PacketType {
  Reqeust = "Request",
  Response = "Response",
}

export async function ReadPacket(
  bufr: BufReader,
): Promise<ReqPacket | Deno.EOF> {
  const tp = new TextProtoReader(bufr);
  const type = await tp.readLine();
  if (type === Deno.EOF) return Deno.EOF;
  switch (type) {
    case PacketType.Reqeust: {
      const reqPac = new ReqPacket();
      const method = await tp.readLine();
      if (method === Deno.EOF) return Deno.EOF;
      reqPac.method = method;
      const payload = await tp.readLine();
      if (payload === Deno.EOF) return Deno.EOF;
      reqPac.payload = payload;
      return reqPac;
    }
    case PacketType.Response: {
      return Deno.EOF; // TODO: add response packet
    }
  }
  return Deno.EOF;
}
