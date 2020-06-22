# Jebena
Simple and lightweight ES6 promise based JSON validation library with **0** dependencies

Heavily inspired by https://github.com/lperrin/paperwork

## Installation
`npm i jebena`

## Usage

```
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

```
import {jebenaExpress} from 'jebena'

const app = express()
app.use(express.json())

//accept only json body, not required (you can check it anyway you want)
app.use((err,req,res,next) => {
    res.status(400).send({"error":"bad request"})
})

const spec = {
    email: isEmail(),
    password: all(String, minLength(8)),
    someUnwantedData: ["/234/sd1"]
}

app.post("/users", jebenaExpress(spec), () => {
    //all unwanted data is removed
    console.log(req.body) // {email: "test@gmail.com", password:"password"}
})

```

That's it. jebena handles the error and returns a 400 response with the below sample body.
```
{
  "message": "Bad Request",
  "errors": [
    "password: must be at least 8 characters long"
  ]
}
```

## Types

Supports Javascript primitive data types `String, Number, Boolean` + custom types

### Arrays

```
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
```
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

`all(type1, type2, type3)` - validates each type

```
const spec = {
    phone: all(Number, length(10))
}
```

`minLength(num)` - validates minimum length

```
const spec = {
    password: all(String, minLength(8))
}
```

`match(regex, customErrorMsg)` - tests regular expression against the value

```
const spec = {
    phone: match(/^\d+$/) //numbers only
}
```

`isEmail()` - check if string is in a valid email format

```
const spec = {
    phone: match(/^\d+$/) //numbers only
}
```

### Custom validation
return true/false from your function

return `[<boolean>, <customErrorMsg>]` if you want to pass custom error msg

```
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

## Tests

`npm run test`