# flowProbe server simulation

After a client connects to the SSE server, an SSE connection is opened with the following message types permitted in a connection : 

| Message type     | Description
|------------------| --- |
| spawn            | The domain entity here - a pair of `Order` and `Payment` data  
| info             | Simple one sentance description of the situation
| scale-up         | The cluster is scaling up - `factor` field tells by how many pods 
| scale-down       | The cluster is scaling down - `factor` respectively 
| start | Start of stream of messages 
| end   | Stream closed 

Each message with an example is explained in relevant section below. 
 
A stream should last from two to three minutes, where the main idea is to simulate large stream of data - 
the inspiration could be a large retailer where customers are placing orders (the Order entity) 
for which they're paying (the Payment entity) throughout a typical busy day, 
however this day is squeezed into the 2-3 minute simulation. 

## Entities
Order and Payment are entities which are sent in a "spawn" message. 
The fields "type" and "name" within an order or a payment are randomly selected from attached files order.json and payment.json respectively, where key is the type and value is an array of possible names for that respective type. The "value" integer field within an order or a name is also selected randomly somewhere between 1 and 50. The simulation should also inform about what is going on in the system with

Example `spawn` message : 

```json
{
    "type" : "spawn",
    "uuid" : "0c315c3e-9f10-4a99-a054-de36def70a62",
    "order" : {
        "uuid" : "db263378-3501-405b-8261-7c7795ac1ccd",
        "type": "mobile",
        "name": "android",
        "value": 17
    },
    "payment" : {
        "uuid" : "08adedd7-90dd-49a5-9f55-ef68c46a13af",
        "type": "card",
        "name": "visa",
        "value": 34
    }
}
```

## Infrastructure

Let's pretend that software infrastructure needed for handling the orders and payments in the simulation is running on an on-demand scaled cluster of nodes (1-12).
Each cluster starts with two nodes. 
You should inform about the scaling up (message type `scale-up`) or down (message type `scale-down`) with respective `entity` field ("order" or "payment") and `factor` integer field.

Example scaling messages :

```json
{
    "type": "scale-up",
    "entity": "order",
    "factor" : 2
}
```
```json
{
    "type": "scale-down",
    "entity": "payment",
    "factor" : 1
}
```

## General story / info about the simulation

A handful of words that textually represent current situation in the `message` field  
In the earlier example with large retailers e.g. 
"Usual busy high street increasing retail" or "Home online presence increasing desktop".
But it's up to how you textually represent snapshots in your simulation.

Example `info` message : 

```
### info
```json
{
    "type" : "info",
    "message" : "A higher visitor rate expected."
}
```

## SSE connection lifecycle 
The very first message in a SSE connection is a `start` message and the very last message 
is an `end` message, both with relevant `connection_uuid` (String/UUID) 
and `timestamp` (String/ISO-timestamp) fields

Example info `start` message
```json
{
    "type" : "start",
    "uuid" : "52c8b1a0-f92c-45fa-a5f6-3db14206d923",
    "timestamp" : "2025-09-06T22:52:52Z"
}
```

Example info `end` message
```json
{
    "type" : "end",
    "uuid" : "52c8b1a0-f92c-45fa-a5f6-3db14206d923",
    "timestamp" : "2025-09-06T22:55:11Z"
}
```

