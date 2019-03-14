const assert = require("assert");
const { PubSub } = require("@google-cloud/pubsub");

const topicName = "testTopic";
const subscriptionName = "testSub";

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

testSubjectMock.retryMostRecentPublish()

assert.equal(deliveryCount, 2)


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

assert.throws(()=>{
  subscription.on("whatevs", ()=>{})
})

try{
  subscription.on("whatevs", ()=>{})
} catch(e){
  assert(e.message.match(/reference to 'on' function/))
}


console.log("Feel free to contribute more tests :*");
