# flowProbe

Live visualisation using **d3.js** that visualises flow of data around two entities (e.g. `Orders` and `Payments`) from their respective sources (arcs) to their respective services (circle in the centre) which display the current scaling (a node/circle grid). Each service displays the current per-sec rate of the flow. 

Live demo : [touchfeed.github.io/flowProbe](https://touchfeed.github.io/flowProbe/)

## Structure of data

Examples have some attributes omitted - their showing only skeleton.


### Entities

Example of `Order` entity `(data/orders.json)`, similarly for`Payment`. 

```json
{
    "mobile": {
        "name": "mobile",
        "children": {
            "ios": {},
            "android": {}
        }
    },
    "desktop": {
        "name": "desktop",
        "children": {
            "chrome": {},
            "safari": {}
        }
    },
    "retail": {
        "name": "retail",
        "children": {
            "windows": {},
            "linux": {}
        }
    }
}
```

### Services

`data/services.json` contain the (service) nodes per each entity. 

```json
{
    "orders": {
        "name": "Orders",
        "children": [
            "order-service-instance1",
            "order-service-instance2",
            "order-service-instance3"
        ]
    },
    "payments": {
        "name": "Payments",
        "children": [
            "payment-service-instance1",
            "payment-service-instance2"
        ]
    }
}


```


## Running example

The actual JavaScript sources (with d3.js logic) are in `fp` directory.

`index.js` is doing the orchestration (wiring the data with the flowProbe instance).
