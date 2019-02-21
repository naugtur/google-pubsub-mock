const sinon = require("sinon");
module.exports = {
  setUp({ sinonSandbox, topics, PubSub }) {
    if (!PubSub) {
      console.warn(
        "stubbing methods of",
        require.resolve("@google-cloud/pubsub")
      );
      console.warn(
        "To stub a different copy of the pubsub package, pass the PubSub field in .setUp(options)"
      );
      PubSub = require("@google-cloud/pubsub").PubSub;
    }

    const subscriptionHandlers = {};
    let mostRecentPublish;
    sinonSandbox = sinonSandbox || sinon.createSandbox();
    const ackStub = sinon.stub();
    const pubStub = sinonSandbox.stub((topic, message, attributes) => {
      mostRecentPublish = {topic, message, attributes};
      topics[topic].subscriptions.forEach(subscriptionName => {
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
        if (type === "message") {
          addHandler(subName, callback);
        }
      }
    }));

    return {
      sinonSandbox: sinonSandbox,
      publish: pubStub,
      ackStub,
      retryMostRecentPublish() {
        pubStub(mostRecentPublish.topic, mostRecentPublish.message, mostRecentPublish.attributes)
      }
    };
  }
};

function createMessageFrom(message, attributes, ack) {
  // TODO: implement something smarter
  const data = Buffer.from(message.toString()); //Works with buffer-alike types.
  return {
    data,
    attributes: attributes || {},
    ack
  };
}
