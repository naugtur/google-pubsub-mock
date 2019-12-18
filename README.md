# Transparent mock for @google-cloud/pubsub

## Usage

```js
const mock = require('google-pubsub-mock')
const mockInstance = mock.setUp({
  PubSub: // the PubSub reference you're using ,
  sinonSandbox: // (optional) sinon sandbox instance you're using,
  topics: { // Topics and their subscriptions
      "topicname":{
        subscriptions: [subscriptionName]
      }
    }
});
//publish shorthand function
mockInstance.publish(topic, message, attributes);
//helper for testing multiple delivery attempts
mockInstance.retryMostRecentPublish()

//use sinon features
mockInstance.publish.called //publish is a sinon stub
mockInstance.ack.called //ack is a sinon stub and the same one is added to all messages
mockInstance.sinonSandbox.restore() //clean up the mock, returns PubSub to its previous state.
mockInstance.clearState() //remove all state created by subscriptions and messages to avoid affecting another test suite while reusing one setup
```

if `PubSub` reference is not provided, `require("@google-cloud/pubsub")` is called. **IF** dependency versions matched and got deduplicated in node_modules, it should get the same instance, but that's generally not guaranteed (and not stable long term in my experience) 

Your code might store references to the topic or subscription objects. That's why it is recommended to call `setUp` only once and use `clearState` before or after each test

## Support

Supports versions **0.23.0** and above (until another breaking change. Please report an issue if you're having trouble)

Replaces `PubSub` key exported from the `@google-cloud/pubsub` package only. Direct use of other classes in there is not mocked

uses sinon stubs

### Methods covered:
- topic().publish()
- subscribtion().on("message",...)
- message.ack()

Other methods are not yet mocked and will run the actual implementation, which you'll notice from the errors you'd be getting form `@googlecloud/pubsub`
