export type Packet = ReqPacket|ErrPacket;

export enum ErrorType {
  MethodNotFound = 404,
  Unhandle = 0
}

export class RpcPacket {
}

export class ReqPacket extends RpcPacket {
  method!: string;
  payload!: string;
}

export class ErrPacket extends RpcPacket {
  constructor(
    public errType: ErrorType,
    public msg: string = "",
  ) {
    super();
  }
}