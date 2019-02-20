const sinon = require("sinon");
module.exports = {
  setUp({ sinonSandbox, topics, PubSub }) {
    if (!PubSub) {
      console.log(
        "stubbing methods of",
        require.resolve("@google-cloud/pubsub")
      );
      console.log(
        "To stub a different comy of the pubsub package, pass the PubSub reference in .setUp(options)"
      );
      PubSub = require("@google-cloud/pubsub").PubSub;
    }

    const subscriptionHandlers = {};
    sinonSandbox = sinonSandbox || sinon.createSandbox();
    const ackStub = sinon.stub();
    const pubStub = sinonSandbox.stub((topic, message, attributes) => {
      topics[topic].subscriptions.forEach(subscriptionName => {
        console.log(subscriptionHandlers);
        subscriptionHandlers[subscriptionName].forEach(subHandler =>
          subHandler(createMessageFrom(message, attributes, ackStub))
        );
      });
    });
    function addHandler(subName, handler) {
      if (!subscriptionHandlers[subName]) {
        subscriptionHandlers[subName] = [];
      }
      subscriptionHandlers[subName].push(handler);
    }

    sinonSandbox.stub(PubSub.prototype, "topic").callsFake(topic => ({
      publish: (message, attributes) => pubStub(topic, message, attributes)
    }));
    sinonSandbox.stub(PubSub.prototype, "subscription").callsFake(subName => ({
      on: (type, callback) => {
        console.log("message!");
        if (type === "message") {
          addHandler(subName, callback);
        }
      }
    }));

    return {
      sinonSandbox: sinonSandbox,
      publish: pubStub,
      ackStub
    };
  }
};

function createMessageFrom(message, attributes, ack) {
  // TODO: implement csomething smarter
  const data = Buffer.from(message.toString()); //Works with buffer-alike types.
  return {
    data,
    attributes: attributes || {},
    ack
  };
}
