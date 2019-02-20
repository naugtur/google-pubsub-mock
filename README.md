# Transparent mock for @google-cloud/pubsub

## Usage

```js
const mock = require('google-pubsub-mock')
const mockInstance = mock.setUp({
  sinonSandbox: (optional) sinon sandbox instance you're using,
  topics: {
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


## Support

Supports versions **0.23.0** and above (until another breaking change. Please report an issue if you're having trouble)

Replaces `PubSub` key exported from the `@google-cloud/pubsub` package only. Direct use of other classes in there is not mocked

uses sinon stubs