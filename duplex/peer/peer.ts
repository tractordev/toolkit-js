// @ts-ignore
import * as rpc from "../rpc/mod.ts";
// @ts-ignore
import * as fn from "../fn/mod.ts";
// @ts-ignore
import * as codec from "../codec/mod.ts";
// @ts-ignore
import * as api from "../api.ts";

export class Peer implements rpc.Caller, rpc.Handler {
  session: api.Session;
  caller: rpc.Caller;
  codec: codec.Codec;
  responder: rpc.RespondMux;

  constructor(session: api.Session, codec: codec.Codec) {
    this.session = session;
    this.codec = codec;
    this.caller = new rpc.Client(session, codec);
    this.responder = new rpc.RespondMux();
  }

  close(): Promise<void> {
    return this.session.close();
  }

  async respond() {
    while (true) {
      const ch = await this.session.accept();
      if (ch === null) {
        break;
      }
      rpc.Respond(ch, this.codec, this.responder);
    }
  }

  async call(selector: string, params: any): Promise<rpc.Response> {
    return this.caller.call(selector, params);
  }

  handle(selector: string, handler: rpc.Handler) {
    this.responder.handle(selector, handler);
  }

  respondRPC(r: rpc.Responder, c: rpc.Call) {
    this.responder.respondRPC(r, c);
  }

  proxy(): any {
    return fn.methodProxy(this.caller);
  }

  // deprecated
  virtualize(): any {
    return rpc.VirtualCaller(this.caller);
  }

}
