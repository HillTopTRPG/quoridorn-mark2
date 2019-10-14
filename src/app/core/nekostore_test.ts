import Nekostore from "nekostore"; // "app-server"
import BasicDriver from "nekostore/lib/driver/basic";
import SocketDriver from "nekostore/lib/driver/socket";
import Socket from "nekostore/lib/driver/socket/Socket"; // "app-server/lib/driver/basic"
import SocketClient from "socket.io-client";

interface Data {
  foo: string;
  bar?: number;
}

export async function nekostore_test_client(): Promise<void> {
  const socket = SocketClient.connect("http://localhost:2222");
  const driver = new SocketDriver({ socket });
  const nekostore = new Nekostore(driver);

  // const c1Ref = app-server.collection<Data>("c1");
  // const unsubscribe1 = await c1Ref.onSnapshot(snapshot => {
  //   snapshot.docs.forEach(doc => {
  //     window.console.log(doc.ref.id, doc.type, doc.data);
  //   });
  // });
  //
  // const d1Ref = await c1Ref.doc("d1");
  // const unsubscribe2 = await d1Ref.onSnapshot(snapshot => {
  //   window.console.log(snapshot.exists(), snapshot.data);
  // });
  //
  // await d1Ref.set({ foo: "a", bar: 0 });
  // await d1Ref.update({ bar: 1 });
  // await d1Ref.delete();
  //
  // await c1Ref.add({ foo: "b" });
  //
  // await unsubscribe1();
  // await unsubscribe2();

  const c1Ref = nekostore.collection<Data>("c1");

  const unsubscribe1 = await c1Ref.onSnapshot(snapshot => {
    snapshot.docs.forEach(doc => {
      window.console.log(doc.ref.id, doc.type, doc.data);
    });
  });

  const d1Ref = await c1Ref.doc("d1");
  // const unsubscribe2 = await d1Ref.onSnapshot(snapshot => {
  //   window.console.log(snapshot.exists(), snapshot.data);
  // });
  await d1Ref.set({ foo: "a", bar: 0 });
  // await d1Ref.update({ bar: 1 });
  // await d1Ref.delete();

  await unsubscribe1();
}

export async function nekostore_test(): Promise<void> {
  const driver = new BasicDriver();
  const nekostore = new Nekostore(driver);

  window.window.console.log("Get collectiopn reference");
  const c1Ref = nekostore.collection<Data>("c1");

  window.window.console.log("Get document reference");
  const d1Ref = await c1Ref.doc("d1");

  window.window.console.log("Set document");
  await d1Ref.set({ foo: "a", bar: 0 });

  window.window.console.log("Get document snapshot");
  const snapshot1 = await d1Ref.get();
  window.window.console.log(snapshot1.data); // { foo: "a", bar: 0 }

  window.window.console.log("Update document");
  await d1Ref.update({ bar: 1 });
  window.window.console.log((await d1Ref.get()).data); // { foo: "a", bar: 1 }

  window.window.console.log("Delete documment");
  await d1Ref.delete();
  window.window.console.log((await d1Ref.get()).exists()); // false

  window.window.console.log("Add document");
  const d2Ref = await c1Ref.add({ foo: "b" });
  window.window.console.log((await d2Ref.get()).data); // { foo: "b" }

  await c1Ref.add({ foo: "c" });
  await c1Ref.add({ foo: "d", bar: 1 });
  await c1Ref.add({ foo: "e" });

  window.window.console.log("Get collection snapshot");
  const snapshot2 = await c1Ref.get();
  snapshot2.docs.forEach(doc => {
    window.window.console.log(doc.type); // "added";
    window.window.console.log(doc.data);
  });
}
