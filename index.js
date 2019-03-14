const sinon = require("sinon");
const debug = require("debug")("google-pubsub-mock");

let latestStubbedSetupId;

module.exports = {
  setUp({ sinonSandbox, topics, PubSub }) {
    const currentSetupId = Symbol();

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
    const ackStub = sinon.stub();
    const pubStub = sinonSandbox.stub((topic, message, attributes) => {
      mostRecentPublish = {topic, message, attributes};
      topics[topic].subscriptions.forEach(subscriptionName => {
        subscriptionHandlers[subscriptionName].forEach(subHandler =>
          subHandler(createMessageFrom(message, attributes, ackStub))
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

    sinonSandbox.stub(PubSub.prototype, "topic").callsFake(topic => ({
      publish: withInstanceCheck(function publish(message, attributes) {
        return pubStub(topic, message, attributes)
      })
    }));
    sinonSandbox.stub(PubSub.prototype, "subscription").callsFake(subName => ({
      on: withInstanceCheck(function on(type, callback) {
        if (type === "message") {
          addHandler(subName, callback);
        }
      })
    }));

    function withInstanceCheck(func){
      return function(){
        if(latestStubbedSetupId!==currentSetupId){
          throw Error(`[PROBLEM] You're using a cached reference to '${func.name}' function from the previous google-pubsub-mock instance. If your code triggers this warning you should call .setUp() only once for your test suite and use .clearState() to clean up between tests.`)
        }
        return func.apply(this, arguments)
      }
    }

    function clearState(){
      subscriptionHandlers = {}
      mostRecentPublish = undefined
    }

    return {
      sinonSandbox: sinonSandbox,
      publish: pubStub,
      ackStub,
      retryMostRecentPublish() {
        pubStub(mostRecentPublish.topic, mostRecentPublish.message, mostRecentPublish.attributes)
      },
      clearState
    };
  }
};

function createMessageFrom(message, attributes, ack) {
  // TODO: implement something smarter
  const data = Buffer.from(message.toString()); //Works with string and buffer-alike types.
  return {
    data,
    attributes: attributes || {},
    ack
  };
}
