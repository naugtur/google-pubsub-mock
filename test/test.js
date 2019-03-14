const assert = require("assert");
const { PubSub } = require("@google-cloud/pubsub");

const topicName = "testTopic";
const subscriptionName = "testSub";

console.log("-> test basic functionality");

const testSubjectMock = require("../index").setUp({
  topics: {
    [topicName]: {
      subscriptions: [subscriptionName]
    }
  }
});

const pubsub1 = new PubSub();
const publisher = pubsub1.topic(topicName);

const pubsub2 = new PubSub();
const subscription = pubsub2.subscription(subscriptionName);
let deliveryCount = 0;

subscription.on("message", message => {
  assert.deepEqual(message.attributes, { attribute1: 1 });
  assert.equal(message.data.toString(), '{"a":1}');
  deliveryCount++;
  message.ack();
});

publisher.publish(
  Buffer.from(
    JSON.stringify({
      a: 1
    })
  ),
  { attribute1: 1 }
);

console.log("-> test retryMostRecentPublish");

testSubjectMock.retryMostRecentPublish();

assert.equal(deliveryCount, 2);

console.log("-> test cleanup");
assert.equal(testSubjectMock.ackStub.callCount, 2);

testSubjectMock.clearState();
assert.equal(testSubjectMock.ackStub.callCount, 0);

console.log("-> test publish works after cleanup");

subscription.on("message", message => {
  assert.deepEqual(message.attributes, { attribute1: 1 });
  assert.equal(message.data.toString(), '{"a":1}');
  deliveryCount++;
  message.ack();
});

publisher.publish(
  Buffer.from(
    JSON.stringify({
      a: 1
    })
  ),
  { attribute1: 1 }
);


assert.equal(deliveryCount, 3); // 3 because publish#1, retry, publish#2
assert.equal(testSubjectMock.ackStub.callCount, 1); //1 because counts were reset on clearState


console.log("-> test instance caching protection");

// test suite cleanup simulation
testSubjectMock.sinonSandbox.restore();

//creating another instance of mocks
const testSubjectMock2 = require("../index").setUp({
  topics: {
    [topicName]: {
      subscriptions: [subscriptionName]
    }
  }
});

assert.throws(() => {
  subscription.on("whatevs", () => {});
});

try {
  subscription.on("whatevs", () => {});
} catch (e) {
  assert(e.message.match(/reference to 'on' function/));
}


console.log("-> tests finished");

console.log("Feel free to contribute more tests :*");
