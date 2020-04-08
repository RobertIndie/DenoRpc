export type Packet = ReqPacket | ResPacket | ErrPacket;

export enum ErrorType {
  MethodNotFound = 404,
  Unhandle = 0,
}

export class RpcPacket {
}

export class ReqPacket extends RpcPacket {
  method!: string;
  payload!: string;
}

export class ResPacket extends RpcPacket {
  payload!: string;
  constructor(obj: object | string = "") {
    super();
    if (typeof obj === "object") {
      this.payload = JSON.stringify(obj);
    }
    if (typeof obj === "string") {
      this.payload = obj;
    }
  }
}

export class ErrPacket extends RpcPacket {
  constructor(
    public errType: ErrorType,
    public msg: string = "",
  ) {
    super();
  }
}
