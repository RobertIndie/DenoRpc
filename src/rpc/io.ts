import { BufReader, BufWriter } from "https://deno.land/std/io/bufio.ts";
import { TextProtoReader } from "https://deno.land/std/textproto/mod.ts";
import {
  ReqPacket,
  ErrPacket,
  ErrorType,
  Packet,
  ResPacket
} from "./packets.ts";
import { encoder } from "https://deno.land/std/strings/encode.ts";
export enum PacketType {
  Request,
  Response,
  Error,
}

export async function ReadPacket(
  bufr: BufReader,
): Promise<Packet | Deno.EOF> {
  const tp = new TextProtoReader(bufr);
  const typeName = await tp.readLine();
  if (typeName === Deno.EOF) return Deno.EOF;
  const type = (<any> PacketType)[typeName];
  try {
    switch (type) {
      case PacketType.Request: {
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
        const resPac = new ResPacket();
        const payload = await tp.readLine();
        if (payload === Deno.EOF) return Deno.EOF;
        resPac.payload = payload;
        return resPac;
      }
      case PacketType.Error: {
        const errType = (<any> ErrorType)[Number(await tp.readLine())];
        let msg = await tp.readLine();
        if (msg === Deno.EOF) msg = "";
        return new ErrPacket(errType, msg);
      }
    }
  } catch (e) {
    console.log(e);
    return Deno.EOF;
  }
  return Deno.EOF;
}

export async function WritePacket(
  bufw: BufWriter,
  packet: Packet,
) {
  if (packet instanceof ReqPacket) {
    await bufw.write(encoder.encode(PacketType[PacketType.Request] + "\n"));
    await bufw.write(encoder.encode(packet.method + "\n"));
    await bufw.write(encoder.encode(packet.payload + "\n"));
  }
  if (packet instanceof ErrPacket) {
    await bufw.write(encoder.encode(PacketType[PacketType.Error] + "\n"));
    await bufw.write(encoder.encode(packet.errType + "\n"));
    await bufw.write(encoder.encode(packet.msg + "\n"));
  }
  if (packet instanceof ResPacket) {
    await bufw.write(encoder.encode(PacketType[PacketType.Response] + "\n"));
    await bufw.write(encoder.encode(packet.payload + "\n"));
  }
  bufw.flush();
}
