import jebena, {dependsOn,jebenaExpress, minLength, maxLength, length, all, match, equals, isEmail, oneOf, any} from "./src/validator.js"

class ExpressMock {
    goToNext = false
    errors = {
        status: null, 
        msg: null
    }
    req = {
        body:null, 
        query: null
    }
    res = {
        send: this.send,
        status: function(val){
            this.errors.status = val
            return this
        }.bind(this)
    }
    send = (val) => {
        this.errors.msg = val
        return this
    }
    next = () => {
        this.goToNext = true
        return this
    }
    async post(path, spec, callback, dataSource = "body"){
        await jebenaExpress(spec, dataSource)(this.req, this.res, this.next)
        if(this.goToNext) callback(this.req, this.res)
    }
} 

const Color = {
    Reset: "\x1b[0m",
    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m"
  }

const colorify = (color, string) =>{
    return `${color}${string}${Color.Reset}`
   
}

const testResult = (description, expectation, actual, err = null) => {
    if(expectation === actual){
        console.log(`it should ${description}: ${ colorify(Color.FgGreen, "passed")}`)
        return true
    }
    else {
        console.log(`it should ${description}: ${colorify(Color.FgRed, "failed")} -> \x1b[31m${err}\x1b[0m`)
       
        return false 
    }
}
const description = (state, specType, inputType, msg = "") => `return ${state == "return false"?colorify(Color.FgRed, "false"): colorify(Color.FgGreen, "true")} for spec type ${ colorify(Color.FgYellow, specType)} and input type ${colorify(Color.FgYellow, inputType)}${msg}`

const tests = [
    //description, expectation, json spec, value being tested
    [description("return true", "string", "string"), true, {name: String}, {name: "Foo Bar"}],
    [description("return false", "string", "string object"), false, {name: String}, {name: new String("Foo bar")}],
    [description("return false","string", "number"), false, {name: String}, {name: 4}],
    [description("return false", "string", "boolean"), false, {name: String}, {name: false}],
    [description("return false", "string", "undefined"), false, {name: String}, {name: undefined}],
    [description("return false", "string", "null"), false, {name: String}, {name: null}],
    [description("return false", "string", "object[any]"), false, {name: String}, {name: {}}],
    [description("return true", "number", "number"), true, {age: Number}, {age: 4}],
    [description("return true", "number", "number", " (decimal)"), true, {age: Number}, {age: 4.1}],
    [description("return true", "number", "string", " (number)"), true, {age: Number}, {age: "4.1"}],
    [description("return false", "number", "string", " (empty string)"), false, {age: Number}, {age: ""}],
    [description("return false", "number", "number", " (Infinity)"), false, {age: Number}, {age: Infinity}],
    [description("return false", "number", "number", " (-Infinity)"), false, {age: Number}, {age: -Infinity}],
    [description("return false", "number", "string", " (Infinity)"), false, {age: Number}, {age: "Infinity"}],
    [description("return false", "number", "string", " (-Infinity)"), false, {age: Number}, {age: "-Infinity"}],
    [description("return true", "number", "number", " (scientfic notation)"), true, {age: Number}, {age: 1e2}],
    [description("return true", "number", "number", " (parsed)"), true, {age: Number}, {age: parseInt("45")}],
    [description("return false", "number", "boolean"), false, {age: Number}, {age: false}],
    [description("return false", "number", "null"), false, {age: Number}, {age: null}],
    [description("return false", "number", "number object"), false, {age: Number}, {age: new Number()}],
    [description("return false", "number", "undefined"), false, {age: Number}, {age: undefined}],
    [description("return false", "number", "object<any>"), false, {age: Number}, {age: {}}],
    [description("return true", "array<any>", "array"), true, {name: []}, {name: ["string"]}],
    [description("return true", "array<any>", "array<any>"), true, {name: []}, {name: [1]}],
    [description("return false", "array<any>", "array<any>", " (empty array)"), false, {name: []}, {name: []}],
    [description("return false", "array<any>", "string object"), false, {name: []}, {name: new String("Foo bar")}],
    [description("return false","array<any>", "number"), false, {name: []}, {name: 4}],
    [description("return false", "array<any>", "boolean"), false, {name: []}, {name: false}],
    [description("return false", "array<any>", "undefined"), false, {name: []}, {name: undefined}],
    [description("return false", "array<any>", "null"), false, {name: []}, {name: null}],
    [description("return false", "array<any>", "object<any>"), false, {name: []}, {name: {}}],
    [description("return true", "array<String>", "array<String>"), true, {name: [String]}, {name: ["hello"]}],
    [description("return false","array<String>", "array<Number>"), false, {name: [String]}, {name: [4]}],
    [description("return false", "array<String>", "array<Boolean>"), false, {name: [String]}, {name: [false]}],
    [description("return false", "array<String>", "array<undefined>"), false, {name: [String]}, {name: [undefined]}],
    [description("return false", "array<String>", "array<null>"), false, {name: [String]}, {name: [null]}],
    [description("return false", "array<String>", "array<Object<any>>"), false, {name: [String]}, {name: [Object]}],
    [description("return true", "array<Number>", "array<Number>"), true, {name: [Number]}, {name: [2]}],
    [description("return false","array<Number>", "array<String>"), false, {name: [Number]}, {name: [""]}],
    [description("return false", "array<Number>", "array<Boolean>"), false, {name: [Number]}, {name: [false]}],
    [description("return false", "array<Number>", "array<undefined>"), false, {name: [Number]}, {name: [undefined]}],
    [description("return false", "array<Number>", "array<null>"), false, {name: [Number]}, {name: [null]}],
    [description("return true", "array<Boolean>", "array<Boolean>"), true, {name: [Boolean]}, {name: [true]}],
    [description("return false", "array<Boolean>", "array<String>"), false, {name: [Boolean]}, {name: [""]}],
    [description("return false", "array<Boolean>", "array<undefined>"), false, {name: [Boolean]}, {name: [undefined]}],
    [description("return false", "array<Boolean>", "array<null>"), false, {name: [Boolean]}, {name: [null]}],
    [description("return false", "array<Boolean>", "array<Object<any>>"), false, {name: [Boolean]}, {name: [Object]}],
    [description("return true", "object<any>", "Object<any>"), true, {name: {}}, {name: [Object]}],
    ["validate array of nested types - 1 ", true, {books:[{person:{docs:[{id:String, link: {self:String}}]}}]}, {books:[{person:{docs:[{id:"234234",link:{self:"http://google.com"}}]}}]}],
    ["validate array of nested types - 2 ", false, {books:[{person:{docs:[{id:String, link: {self:String}}]}}]}, {books:[{person:{docs:[{id:5,link:{self:"http://google.com"}}]}}]}],
    ["validate length function for type string and expect -> true", true, {password:length(5)}, {password:"55555"} ],
    ["validate length function for type string and expect -> false", false, {password:length(15)}, {password:"55555"} ],
    ["validate length function for type number and expect -> true", true, {password:length(5)}, {password:55556} ],
    ["validate length function for type number and expect -> false", false, {password:length(5)}, {password:34} ],
    ["validate minLength function for type string and expect -> true", true, {password:minLength(5)}, {password:"55555"} ],
    ["validate minLength function for type string and expect -> false", false, {password:minLength(15)}, {password:"55555"} ],
    ["validate minLength function for type number and expect -> true", true, {password:minLength(5)}, {password:555555} ],
    ["validate minLength function for type number and expect -> false", false, {password:minLength(5)}, {password:34} ],
    ["validate maxLength function for type string and expect -> true", true, {password:maxLength(5)}, {password:"55555"} ],
    ["validate maxLength function for type string and expect -> false", false, {password:maxLength(1)}, {password:"55555"} ],
    ["validate maxLength function for type number and expect -> true", true, {password:maxLength(15)}, {password:555555} ],
    ["validate maxLength function for type number and expect -> false", false, {password:maxLength(1)}, {password:34} ],
    ["validate minLength function for type array and expect -> false", false, {password:maxLength(1)}, {password:[]} ],
    ["validate minLength function for type boolen and expect -> false", false, {password:maxLength(1)}, {password:false} ],
    ["validate minLength function for type null and expect -> false", false, {password:maxLength(1)}, {password:null} ],
    ["validate minLength function for type undefined and expect -> false", false, {password:maxLength(1)}, {password:undefined} ],
    ["validate minLength function for type object<any> and expect -> false", false, {password:maxLength(1)}, {password:{}} ],
    ["validate maxLength function for type array and expect -> false", false, {password:maxLength(1)}, {password:[]} ],
    ["validate maxLength function for type boolen and expect -> false", false, {password:maxLength(1)}, {password:false} ],
    ["validate maxLength function for type null and expect -> false", false, {password:maxLength(1)}, {password:null} ],
    ["validate maxLength function for type undefined and expect -> false", false, {password:maxLength(1)}, {password:undefined} ],
    ["validate maxLength function for type object<any> and expect -> false", false, {password:maxLength(1)}, {password:{}} ],
    ["validate multiple specs ({phone:all(Number, length(10))}) and expect -> true", true, {phone:all(Number, length(10))}, {phone:1234567891}],
    ["validate multiple specs ({phone:all(Number, length(10))}) and expect -> false", false, {phone:all(Number, length(10))}, {phone:123456}],   
    ["validate regex only numbers spec and expect -> true", true, {phone:match(/^\d+$/)}, {phone:234234}],   
    ["validate regex only numbers spec and expect -> false - wrong type", false, {phone:match(/^\d+$/)}, {phone:false}],   
    ["validate regex only numbers spec and expect -> false - wrong value", false, {phone:match(/^\d+$/)}, {phone:"skdfsdf"}],
    ["validate regex only numbers spec and expect -> false - empty string", false, {phone:match(/^\d+$/)}, {phone:""}],
    ["validate equals function -> expect true", true, {phone:equals("12345")}, {phone:"12345"}],
    ["validate equals function -> expect false - wrong type", false, {phone:equals("12345")}, {phone:false}],   
    ["validate equals function -> expect false - wrong value", false, {phone:equals("12345")}, {phone:"1345"}],   
    ["validate oneOf function -> expect true", true, {role: oneOf(["admin", "customer"])}, {role:"admin"}],
    ["validate oneOf function -> expect false - wrong type", false, {role: oneOf(["customer"])}, {role:false}],   
    ["validate oneOf function -> expect false - invalid argument", false, {role: oneOf("foo bar")}, {role:false}],   
    ["validate oneOf function -> expect false - wrong value", false, {role: oneOf(["admin", "customer"])}, {role:"foo bar"}],   
    ["validate isEmail function -> expect true", true, {email:isEmail()}, {email:"foo@bar.com"}],   
    ["validate isEmail function -> expect false - wrong type", false, {email:isEmail()}, {email:2}],   
    ["validate isEmail function -> expect false - invalid email", false, {email:isEmail()}, {email:"foobar@ccom"}],   
    ["validate isEmail function -> expect false - invalid email", false, {email:isEmail()}, {email:"foobarccom@"}]   ,
    ["not allow missing props", false, {age:Number}, {}],   
    ["allow custom validation -> expect false", false, {age:all(Number, (val) => val > 20?true:false)}, {age:18}],   
    ["allow custom validation -> expect true", true, {age:all(Number, (val) => val > 20?true:false)}, {age:21}],   
    ["allow optional value -> expect true", true, {"age?":Number}, {}],   
    ["allow optional value -> expect true", true, {"age?":Number}, {age:23}],   
    ["allow optional value -> expect false -- wrong type", false, {"age?":Number}, {age:"s"}],   
    ["validate dependsOn -- condition not met", true, {"age?":Number, title: all(String,length(4), dependsOn("age", (val) => val > 15))}, {age:6}],   
    ["validate dependsOn -- condition met", false, {"age?":Number, title: all(String,length(4), dependsOn("age", (val) => val > 5))}, {age:6}],   
    ["validate 'any' function", true, {name: any()}, {name:6}],   
    ["validate 'any' function -- undefined value", false, {name: any()}, {names:6}],   
]



console.log(colorify(Color.FgCyan, "Starting tests for jebena..."))

const runTests = async (tests) => {
    const results = {passed:0, failed:0, time: Date.now()}
    for (const test of tests) {
        jebena(test[2], test[3])
        .then((res) => {
            testResult(test[0],test[1],true)? results.passed += 1: results.failed += 1
        })
        .catch((err) => {
            testResult(test[0],test[1],false, err)? results.passed += 1: results.failed += 1
        })
    }
    //extra data removal test
    jebena({name:String, "age?":Number}, {name:"hello", age:3, title:"ss"})
    .then(res => {
        const props = Object.keys(res)
        testResult("remove extra data",props.length === 2,true)? results.passed += 1: results.failed += 1
    })
    .catch((err) => {
        const props = Object.keys(res)
        testResult("remove extra data",props.length === 2,false)? results.passed += 1: results.failed += 1
    })

    //custom validation test
    await jebena({age:(val) => {
        if(val < 18) return [false, "you must be 18 to register for this service"]
        return true
    }}, {age:16})
    .then(res => {
        testResult("display custom error message for functions", err[0] == "you must be 18 to register for this service", true) ? results.passed += 1: results.failed += 1
    })
    .catch(err => {
        testResult("display custom error message for functions", err[0] == "you must be 18 to register for this service", false)? results.passed += 1: results.failed += 1
    })

    //express test
    const spec = {
        name: String,
        age: Number
    }
    const app = new ExpressMock()

    //invalid body test
    app.req.body = {
        name: "Foo bar",
        age: "3s4"
    }
    await app.post("/", spec, (req, res) => {})
    testResult("return 404 response with description when passed invalida value -- Expressjs req.body test", true, app.errors.status == 400 && app.errors.msg != null) ? results.passed += 1: results.failed += 1

     //valid body && cleaned data test
    let data = null
     app.req.body = {
        name: "Foo bar",
        age: 3,
        extraProp: "hello world"
    }

    await app.post("/", spec, (req, res) => {
        data = req.body
    })
    testResult("return cleaned data in req.body -- Expressjs test", true,  data != null && data.age == 3 && !("extraProp" in data)) ? results.passed += 1: results.failed += 1

     //invalid query test
     app.req.query = {
        name: "Foo bar",
        age: "3s4"
    }
    await app.post("/", spec, (req, res) => {}, "query")
    testResult("return 404 response with description when passed invalida value -- Expressjs req.query test", true, app.errors.status == 400 && app.errors.msg != null) ? results.passed += 1: results.failed += 1

     //valid query && cleaned data test
     app.req.query = {
        name: "Foo bar",
        age: 3,
        extraProp: "hello world"
    }

    await app.post("/", spec, (req) => {
        data = req.query
    }, "query")
    testResult("return cleaned data in req.query -- Expressjs test", true,  data != null && data.age == 3 && !("extraProp" in data)) ? results.passed += 1: results.failed += 1

    
    return results
   
}


runTests(tests).then(res => {
    console.log(`---------------------------------------------------\n${colorify(Color.FgCyan, 'Testing finished.')} ${(Date.now()-res.time)/1000} secs `)
    console.log(`Tests run: ${res.failed + res.passed}`)
    console.log(`Passed: ${colorify(Color.FgGreen,res.passed)}`)
    console.log(`Failed: ${colorify(Color.FgRed,res.failed)}\n`)
    if(res.failed == 0){
        console.log(`${colorify(Color.BgGreen, colorify(Color.FgBlack,' ALL TESTS HAVE PASSED '))}\n`)
    }
    else{
        console.log(`${colorify(Color.BgRed, colorify(Color.FgBlack,` ${res.failed} TEST(S) HAVE FAILED `))}\n`)
        process.exit(1)
    }
    
})
