# Messages 

The following JSON messages with respective types are transported throughout a SSE session 



The following are examples of a JSON message pushed down the connection each respective to it's type.

### spawn
```json
{
    "type" : "spawn",
    "uuid" : "ejfhaewfhalewkjfhlawehfla",
    "order" : {
        "uuid" : "ejfhaewfhalewkjfhlawehfla",
        "type": "mobile",
        "name": "android",
        "value": 17
    }, 
    "payment" : {
        "uuid" : "ejfhaewfhalewkjfhlawehfla",
        "type": "card",
        "name": "visa",
        "value": 34
    }
}


```
### info
```json
{
    "type" : "info",
    "message" : "A higher visitor rate expected."
}

```
### scale-up
```json
{
    "type" : "scale-up",
    "cluster" : "order",
    "factor" : 2
}
```
### scale-down
```json
{
    "type" : "scale-down",
    "cluster" : "payment",
    "factor" : 1
}


```
### connection-start
```json
{
    "type" : "connection-start",
    "uuid" : "SSE Connection UUID"
}
```
### connection-end
```json
{
    "type" : "connection-end",
    "uuid" : "SSE Connection UUID"
}


```