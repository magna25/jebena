# Jebena
![CI](https://github.com/magna25/jebena/workflows/CI/badge.svg)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![npm version](https://badge.fury.io/js/jebena.svg)](https://badge.fury.io/js/jebena)


Lightweight ES6 promise based JSON validation library with **0** dependencies

Heavily inspired by https://github.com/lperrin/paperwork

## Installation
`npm i jebena`

## Usage

```javascript
import jebena from 'jebena'


const spec = {
    name: String,
    age: Number,
    "phone?": Number // ? means optional prop
}

const data = {
    name: "Foo Bar",
    age: 34
}

jebena(spec, data)
.then( res => {
    console.log(res) //outputs cleaned and validated data
})
.catch(err => {
    console.log(err) //outputs array of errors
})

```
## Express

```javascript
import {jebenaExpress} from 'jebena'

const app = express()
app.use(express.json())

//catch json errors, not required (however, you must make sure req.body is a json data before you call jebenaExpress)
app.use((err,req,res,next) => {
    res.status(400).send({"error":"bad request"})
})

const spec = {
    email: isEmail(),
    password: all(String, minLength(8)),
}

app.post("/users", jebenaExpress(spec), () => {
    //req.body is validated and cleaned
})
```
`jebenaExpress()` by default runs the validation against req.body 
but you can change that by passing a second argument.


```javascript

const spec = {
    page: Number,
    pageSize: Number
}

app.get("/products", jebenaExpress(spec, "query"), () => {
    //req.query is validated and cleaned
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

## Types

Supports Javascript primitive data types `String, Number, Boolean` + custom types

### Arrays

```javascript
const spec = {
    books: [] //array of any type
    books: [String] //array of strings
    books: [Number] //array of numbers
    books: [Boolean] //array of booleans
    books: [{
        id: String,
        title: String,
        year: Number
    }] //array of literal objects
}
```

### Nested objects

```javascript
const spec: [
    person: {
        id: Number,
        address: {
            street: String,
            ...
        },
        someProp: {
            anotherProp: {
                anotherProp: [
                    {
                        id: Number,
                        name: String
                    }
                ]
            }
        }

    }
]
```

### Custom types

`all(type1, type2, type3...)` - validates each type

```javascript
const spec = {
    phone: all(Number, length(10))
}
```

`minLength(num)` - validates minimum length

```javascript
const spec = {
    password: all(String, minLength(8))
}
```

`maxLength(num)` - validates maximum length

```javascript
const spec = {
    username: maxLength(25)
}
```

`length(num)` - checks if value is exactly n characters long

```javascript
const spec = {
    phone: length(10)
```

`match(regex, customErrorMsg)` - tests regular expression against the value

```javascript
const spec = {
    phone: match(/^\d+$/) //numbers only
}
```

`isEmail()` - check if string is in a valid email format

```javascript
const spec = {
    email: isEmail()
}
```

`equals(val)` - verfies user value matches the defined value

```javascript
const spec = {
    role: equals("ADMIN")
}
```

`oneOf([val1, val2..])` - verfies user value is one of the array elements

```javascript
const spec = {
    role: oneOf(["ADMIN", "CUSTOMER"])
}
```

### Custom validation

return `true/false` from your function

return `[<boolean>, <customErrorMsg>]` if you want to pass custom error msg

```javascript
const spec = {
    fullName: (val) => {
        const fn = val.split(" ")
        if(fn.length < 2) return [false, "enter full name"] //return array for custom error message
        return true
    },
    age: (val) => {
        return val > 18
    }
}
```

## Test

`npm run jebena-test`