let r = [
    {
        "type": "lstm",
        "params": {
            "inputShape": [
                24,
                21
            ],
            "units": 21,
            "returnSequences": true,
            "cell": {}
        }
    },
    {
        "type": "lstm",
        "params": {
            "units": 113,
            "returnSequences": true
        }
    },
    {
        "type": "flatten",
        "params": {}
    },
    {
        "type": "dense",
        "params": {
            "units": 6,
            "activation": "sigmoid"
        }
    }
]