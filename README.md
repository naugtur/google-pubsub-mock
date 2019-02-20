# Transparent mock for @google-cloud/pubsub

## Usage

```js
const mock = require('google-pubsub-mock')
const mockInstance = mock.setUp({
  PubSub: // the PubSub reference you're using ,
  sinonSandbox: // (optional) sinon sandbox instance you're using,
  topics: { // Topics and their subscriptions
      "topicname":{,
        subscriptions: [subscriptionName]
      }
    }
});
//publish shorthand function
mockInstance.publish({ topic, subscription, message });
//restore when finished using
mockInstance.sinonSandbox.restore()
```

if `PubSub` refeerence is not provided, `require("@google-cloud/pubsub")` is called. IF dependency versions matched and got deduplicated in node_modules, it should get the same instance, but that's generally not guaranteed (and not stable long term in my experience) 


## Support

Supports versions **0.23.0** and above (until another breaking change. Please report an issue if you're having trouble)

Replaces `PubSub` key exported from the `@google-cloud/pubsub` package only. Direct use of other classes in there is not mocked

uses sinon stubs

### Methods covered:
- topic().publish()
- subscribtion().on("message",...)
- message.ack()