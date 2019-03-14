const sinon = require("sinon");
const debug = require("debug")("google-pubsub-mock");

let latestStubbedSetupId;

module.exports = {
  setUp({ sinonSandbox, topics, PubSub }) {
    const currentSetupId = Symbol();
    debug("setup");

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

    let subscriptionHandlers = {};
    let mostRecentPublish;
    sinonSandbox = sinonSandbox || sinon.createSandbox();
    const ackStub = sinonSandbox.stub().callsFake(function() {
      debug(`ack called on message id: ${this.id}`);
    });
    const pubStub = sinonSandbox
      .stub()
      .callsFake((topic, message, attributes) => {
        mostRecentPublish = { topic, message, attributes };
        const messageObject = createMessageFrom(message, attributes, ackStub);

        debug(
          `publish ${topic}, message id: ${messageObject.id} is sent to ${
            topics[topic].subscriptions.length
          } subs`
        );

        topics[topic].subscriptions.forEach(subscriptionName => {
          (subscriptionHandlers[subscriptionName] || []).forEach(subHandler =>
            subHandler(messageObject)
          );
        });
      });

    latestStubbedSetupId = currentSetupId;

    function addHandler(subName, handler) {
      if (!subscriptionHandlers[subName]) {
        subscriptionHandlers[subName] = [];
      }
      subscriptionHandlers[subName].push(handler);
    }

    sinonSandbox.stub(PubSub.prototype, "topic").callsFake(topic => {
      debug(`topic called: ${topic}`);
      return {
        publish: withInstanceCheck(function publish(message, attributes) {
          return pubStub(topic, message, attributes);
        })
      };
    });
    sinonSandbox.stub(PubSub.prototype, "subscription").callsFake(subName => ({
      on: withInstanceCheck(function on(type, callback) {
        if (type === "message") {
          debug(
            `subscriber on("message",) added for: ${subName}`
          );
          addHandler(subName, callback);
        }
      })
    }));

    function withInstanceCheck(func) {
      return function() {
        if (latestStubbedSetupId !== currentSetupId) {
          throw Error(
            `[PROBLEM] You're using a cached reference to '${
              func.name
            }' function from the previous google-pubsub-mock instance. If your code triggers this warning you should call .setUp() only once for your test suite and use .clearState() to clean up between tests.`
          );
        }
        return func.apply(this, arguments);
      };
    }

    function clearState() {
      subscriptionHandlers = {};
      mostRecentPublish = undefined;
      ackStub.resetHistory();
      pubStub.resetHistory();
    }

    return {
      sinonSandbox: sinonSandbox,
      publish: pubStub,
      ackStub,
      retryMostRecentPublish() {
        pubStub(
          mostRecentPublish.topic,
          mostRecentPublish.message,
          mostRecentPublish.attributes
        );
      },
      clearState
    };
  }
};

function createMessageFrom(message, attributes, ack) {
  // TODO: implement something smarter
  const data = Buffer.from(message.toString()); //Works with string and buffer-alike types.

  return {
    id: Math.random()
      .toFixed(12)
      .substring(2),
    data,
    attributes: attributes || {},
    ack
  };
}
