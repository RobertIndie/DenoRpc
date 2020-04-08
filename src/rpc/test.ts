import { serve } from "./server.ts";
import { connect } from "./client.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

class TestMessage {
  constructor(public msg: string) {
  }
}

Deno.test({
  name: "simple rpc test",
  async fn(): Promise<void> {
    const server = serve("localhost:8000");
    const serverReturn = new TestMessage("Hello world.");
    server.Register("rpcTest", (req, cxt) => {
      console.log(req);
      return serverReturn;
    });

    server.Run();

    const client = await connect("localhost:8000");

    class TestReq {
      msg: string = "Hello from client.";
    }

    const res = await client.Call("rpcTest", new TestReq());
    assertEquals(res, serverReturn);

    client.Close();
    server.Close(); // remember to close tcpStream in the end of unit test.
                    // or it will cause resources leakage.
  },
});
