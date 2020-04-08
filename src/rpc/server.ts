enum PacketType {
  Reqeust = 1,
  Response = 2
};

type CallFnType = (req: Object) => Context;

export class RpcPacket{
  type: PacketType = PacketType.Reqeust;
};

export class ReqPacket extends RpcPacket {
  method!: string;
  payload!: string;
};

export class Context{

};

export class RpcServer {
  private services!: {[key: string]: CallFnType;};
  public Register(method: string, fn: CallFnType){
    this.services[method] = fn;
  }
  public UnRegister(method: string){
    delete this.services[method];
  }
}