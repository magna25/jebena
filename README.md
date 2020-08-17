
![alt text](https://i.imgur.com/B0D4Bs6.png) 
<br/>
<br/>
<br/>
![CI](https://github.com/magna25/jebena/workflows/CI/badge.svg)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![npm version](https://badge.fury.io/js/jebena.svg)](https://badge.fury.io/js/jebena)


Lightweight ES6 promise based JSON validation library with **0** dependencies

Heavily inspired by https://github.com/lperrin/paperwork

# Installation
`npm i jebena`

# Usage

```javascript
import jebena from 'jebena'


const spec = {
    name: String,
    age: Number,
    "phone?": Number // ? = optional prop
}

const data = {
    name: "Foo Bar",
    age: 34
}

jebena(spec, data)
.then( res => {
    // cleaned and validated data
})
.catch(err => {
    // array of errors
})

```
# Express

```javascript
import {jx, email, runEach} from 'jebena'

const app = express()
app.use(express.json())

const spec = {
    email: email(),
    password: runEach(String, minLen(8)),
}

app.post("/users", jx(spec), () => {
    //req.body is validated and cleaned
})
```


That's it. jebena returns a 400 response silently if there are any errors. Sample 400 response:

```javascript
{
  "errors": [
    "password: must be at least 8 characters long"
  ]
}
```

# Options

jebena accepts a third optional argument where you can define your preferences. Below are the defaults 

```javascript
const defaultOps = {
    allowEmpty: false,
    ignoreUnknown: true,
    showOnlyFirstErrorForSameKey: false,
    dataSource: "body" //for express only. either 'body' or 'query'

}
```

# Custom Types

`runEach(type1, type2...)` validates each type against key value

`email()` checks if value is email

`len(n)` checks if value is exactly n characters long

`minLen(n)` checks if value is at least n characters long

`maxLen(n)` checks if value is at most n characters long 

`match(reg)` checks if value matches regex 

`equals(val)` checks if value equals given value

`oneOf([el, el2, el3...])` checks if value is equal to one of the array elements 

`ifKey(key, predicate = v => true)` runs validation on current key only if the key argument is present in the spec and the predicate returns true

`ifKey(key, predicate = v => true).runEach(type1, type2...)` validates each type if predicate is true 

`any()` accepts any value but undefined 

`int()` checks if value is integer

`pInt()` checks if value is positive integer

`date(format = "mm/dd/yy")`  checks if value matches date format. Supports `-` or `/` separators and `dd/mm/yyyy` or `mm/dd/yyyy` formats    
 <br/>
<br/>
<br/>

# Advanced Usage

### Custom Validation

For custom validations simply provide a predicate. If you want to return a custom error message, return `[false, <your error message>]`

```javascript
const spec = {
    fullName: (val) => val.split(" ").length == 2 ? true : [false, "invalid name"] 
}
```

### Arrays and nested objects

```javascript
const spec = {
    links: [], //array of any
    address: {
        street: String,
        city: String,
        state: oneOf(statesList),
        zipCode: runEach(int(),len(5))
    }
    books: [{
        title: String,
        author: String,
        yearPublished: int(),
        someProp: {
            otherProp: Number
        }
    }]
}
```

### Param dependent on other param

There might situations where you want to run a validation on a param only if another param meets certain conditions and for that you can use `ifKey()` 

```javascript
const spec  = {
    shippingPreference: oneOf(['pickup', 'delivery']),
    deliveryAddress: ifKey('shippingPreference', v => v == 'delivery').runEach({
        street: String,
        city: String,
        state: oneOf(['az','co']),
        zipCode: runEach(int(),len(5))

    })
}
```
 <br/>

## Test

clone repo to your machine and run:

`npm run jebena-test`