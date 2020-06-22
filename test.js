import jebena, { jebenaExpress, minLength, maxLength, length, all, match, equals, isEmail, isStringNumber} from "./src/validator.js"

//https://stackoverflow.com/a/57100519/1929075
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
const description = (state, specType, inputType, msg = "") => `${state} for spec type ${ colorify(Color.FgYellow, specType)} and input type ${colorify(Color.FgYellow, inputType)}${msg}`

const tests = [
    //description, expectation, json spec, value being tested
    [description("pass", "string", "string"), true, {name: String}, {name: "Foo Bar"}],
    [description("fail", "string", "string object"), false, {name: String}, {name: new String("Foo bar")}],
    [description("fail","string", "number"), false, {name: String}, {name: 4}],
    [description("fail", "string", "boolean"), false, {name: String}, {name: false}],
    [description("fail", "string", "undefined"), false, {name: String}, {name: undefined}],
    [description("fail", "string", "null"), false, {name: String}, {name: null}],
    [description("fail", "string", "object[any]"), false, {name: String}, {name: {}}],
    [description("pass", "number", "number"), true, {age: Number}, {age: 4}],
    [description("pass", "number", "number", " (decimal)"), true, {age: Number}, {age: 4.1}],
    [description("pass", "number", "number", " (scientfic notation)"), true, {age: Number}, {age: 1e2}],
    [description("pass", "number", "number", " (parsed)"), true, {age: Number}, {age: parseInt("45")}],
    [description("fail", "number", "boolean"), false, {age: Number}, {age: false}],
    [description("fail", "number", "null"), false, {age: Number}, {age: null}],
    [description("fail", "number", "number object"), false, {age: Number}, {age: new Number()}],
    [description("fail", "number", "undefined"), false, {age: Number}, {age: undefined}],
    [description("fail", "number", "object<any>"), false, {age: Number}, {age: {}}],
    [description("pass", "array<any>", "array"), true, {name: []}, {name: ["string"]}],
    [description("pass", "array<any>", "array<any>"), true, {name: []}, {name: [1]}],
    [description("fail", "array<any>", "array<any>", " (empty array)"), false, {name: []}, {name: new String("Foo bar")}],
    [description("fail", "array<any>", "string object"), false, {name: []}, {name: new String("Foo bar")}],
    [description("fail","array<any>", "number"), false, {name: []}, {name: 4}],
    [description("fail", "array<any>", "boolean"), false, {name: []}, {name: false}],
    [description("fail", "array<any>", "undefined"), false, {name: []}, {name: undefined}],
    [description("fail", "array<any>", "null"), false, {name: []}, {name: null}],
    [description("fail", "array<any>", "object<any>"), false, {name: []}, {name: {}}],
    [description("pass", "array<String>", "array<String>"), true, {name: [String]}, {name: ["hello"]}],
    [description("fail","array<String>", "array<Number>"), false, {name: [String]}, {name: [4]}],
    [description("fail", "array<String>", "array<Boolean>"), false, {name: [String]}, {name: [false]}],
    [description("fail", "array<String>", "array<undefined>"), false, {name: [String]}, {name: [undefined]}],
    [description("fail", "array<String>", "array<null>"), false, {name: [String]}, {name: [null]}],
    [description("fail", "array<String>", "array<Object<any>>"), false, {name: [String]}, {name: [Object]}],
    [description("pass", "array<Number>", "array<Number>"), true, {name: [Number]}, {name: [2]}],
    [description("fail","array<Number>", "array<String>"), false, {name: [Number]}, {name: [""]}],
    [description("fail", "array<Number>", "array<Boolean>"), false, {name: [Number]}, {name: [false]}],
    [description("fail", "array<Number>", "array<undefined>"), false, {name: [Number]}, {name: [undefined]}],
    [description("fail", "array<Number>", "array<null>"), false, {name: [Number]}, {name: [null]}],
    [description("pass", "array<Boolean>", "array<Boolean>"), true, {name: [Boolean]}, {name: [true]}],
    [description("fail", "array<Boolean>", "array<String>"), false, {name: [Boolean]}, {name: [""]}],
    [description("fail", "array<Boolean>", "array<undefined>"), false, {name: [Boolean]}, {name: [undefined]}],
    [description("fail", "array<Boolean>", "array<null>"), false, {name: [Boolean]}, {name: [null]}],
    [description("fail", "array<Boolean>", "array<Object<any>>"), false, {name: [Boolean]}, {name: [Object]}],
    [description("pass", "object<any>", "Object<any>"), true, {name: {}}, {name: [Object]}],
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
    ["validate equals function and expect -> true", true, {phone:equals("12345")}, {phone:"12345"}],
    ["validate equals function and expect -> false - wrong type", false, {phone:equals("12345")}, {phone:false}],   
    ["validate equals function and expect -> false - wrong value", false, {phone:equals("12345")}, {phone:"1345"}],   
    ["validate isEmail function and expect -> true", true, {email:isEmail()}, {email:"foo@bar.com"}],   
    ["validate isEmail function and expect -> false - wrong type", false, {email:isEmail()}, {email:2}],   
    ["validate isEmail function and expect -> false - invalid email", false, {email:isEmail()}, {email:"foobar@ccom"}],   
    ["validate isEmail function and expect -> false - invalid email", false, {email:isEmail()}, {email:"foobarccom@"}]   ,
    ["validate isStringNumber function and expect -> true", true, {age:isStringNumber()}, {age:"23"}],   
    ["validate isStringNumber function and expect -> true", true, {age:isStringNumber()}, {age:23}],   
    ["validate isStringNumber function and expect -> false - wrong type", false, {age:isStringNumber()}, {age:false}],   
    ["validate isStringNumber function and expect -> false - wrong value", false, {age:isStringNumber()}, {age:"23s"}],   
    ["not allow missing props", false, {age:Number}, {}],   
    ["allow custom validation expect false", false, {age:all(Number, (val) => val > 20?true:false)}, {age:18}],   
    ["allow custom validation expect true", true, {age:all(Number, (val) => val > 20?true:false)}, {age:21}],   
    ["allow optional value and expect true", true, {"age?":Number}, {}],   
    ["allow optional value and expect true", true, {"age?":Number}, {age:23}],   
    ["allow optional value and expect false -- wrong type", false, {"age?":Number}, {age:"234"}],   
]



console.log(colorify(Color.FgCyan, "Starting tests for jebena..."))
const runTests = async(tests) => {
    const results = {passed:0, failed:0, time: Date.now()}
    for (const test of tests) {
        await jebena(test[2], test[3])
        .then((res) => {
            testResult(test[0],test[1],true)? results.passed += 1: results.failed += 1
        })
        .catch((err) => {
            testResult(test[0],test[1],false, err)? results.passed += 1: results.failed += 1
        })
    }
    //extra data removal test
    await jebena({name:String, "age?":Number}, {name:"hello", age:3, title:"ss"})
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
        testResult("display custom error message for functions",err[0] == "you must be 18 to register for this service",true)? results.passed += 1: results.failed += 1
    })
    .catch(err => {
        testResult("display custom error message for functions",err[0] == "you must be 18 to register for this service",false)? results.passed += 1: results.failed += 1
    })
    
    return results
}


runTests(tests).then(res =>{
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
