export type Packet = ReqPacket;

export enum ErrorType {
  TEST = 1
}

export class RpcPacket {
}

export class ReqPacket extends RpcPacket {
  method!: string;
  payload!: string;
}

export class ErrPacket extends RpcPacket {
  errType!: ErrorType;
}
