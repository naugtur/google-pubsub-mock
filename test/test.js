const assert = require("assert");
const { PubSub } = require("@google-cloud/pubsub");

const topicName = "testTopic";
const subscriptionName = "testSub";

const testSubjectStub = require("../index").setUp({
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
  assert.deepEqual(message.data.toString(), '{"a":1}');
  deliveryCount++;
  message.ack()
});

publisher.publish(
  Buffer.from(
    JSON.stringify({
      a: 1
    })
  ),
  { attribute1: 1 }
);

testSubjectStub.retryMostRecentPublish()

assert.equal(deliveryCount, 2)

console.log("Feel free to contribute more tests :*");
