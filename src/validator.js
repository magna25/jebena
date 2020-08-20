const JMultiple = function (vals) {this.vals = vals}
const JMinLength = function (val) {this.val = val}
const JMaxLength = function (val){this.val = val}
const JLength = function (val){this.val = val}
const JMatch = function (reg,errorMsg) {this.reg = reg; this.errorMsg = errorMsg}
const JEquals = function (val) {this.val = val}
const JOneOf = function (val) {this.val = val}
const JEmail = function (){}
const JInt = function (){this._castIfString = false}
const JPositiveInt = function (){this._castIfString = false}
const JAny = function (){}
const JDate = function (format){this.format = format}
const JDependsOn = function (key, predicate) {this.key = key; this.predicate = predicate; this.types = null}

JDependsOn.prototype.runEach = function(...types){
    this.types = types
    return this
}
JInt.prototype.castIfString = function(){
    this._castIfString = true
    return this
}
JPositiveInt.prototype.castIfString = function(){
    this._castIfString = true
    return this
}

const isObjectLiteral = (obj) =>{
    return obj !== null && typeof obj !== undefined && obj.constructor === Object
}

const handleArrayErrors = (key, type, val, options) => {
    let errs = []

    val[key].forEach((v,i) => {
        let err = getViolations(key, type[0],{[key]:v}, options)
        if(err != ""){
            if(Array.isArray(err)){
                errs = errs.concat(
                    err.map((e) => {
                        const er = e.split(".")
                        return er.reduce((acc,cur, j) =>  j == 1 ? acc+`[${i}]`+"#"+cur: acc+"#"+cur)
                     })
                )
            }
            else{ 
                err = err.split(":")
                errs.push(`${err[0]}[${i}]:${err[1]}`)
            }
        }
        
    })

    return errs
}

const isOptional = (key) => {
    return key[key.length-1] == "?"
}


const getType = (val) => {
    if(val instanceof Array && typeof val === "object"){
        return "empty array"
    }
    return typeof val
}

const isNumber = (val) => {
    if(typeof val === "number" && val !== Infinity && val !== -Infinity) return true
    if(typeof val == "string"){
        const num = val.trim()
        if(num !== "" && num !== "Infinity" && num !== "-Infinity" && !isNaN(num))  return true
    }
    return false
}

const getNestedObjValue = (keys, obj) => {
    if(!obj) return null
    const ks = keys.split(".")
    if(ks.length > 1){
        return getNestedObjValue(ks.slice(1).join("."),obj[ks[0]])
    }
    else return obj[ks[0]]
    
}

const getViolations = (key, type, val, options) => {    
    if(!(type instanceof JDependsOn) && !(type instanceof JMultiple) && val[key] === undefined) return `${key}: is required`

    if(isObjectLiteral(type)){
        
        if(isObjectLiteral(val) && key in val) return validator(type, val[key],key, options)
        return `${key}: must be an object, received ${getType(val[key])}`
    }
    else if(type === String) {
        if(typeof val[key] !== "string") return `${key}: must be a string, received ${getType(val[key])}`
        if(!options.allowEmpty &&  val[key] == "") return `${key}: can't be empty`
    }
    else if(type === Number){
        if(!isNumber(val[key])) return `${key}: must be a number, received ${getType(val[key])}`
        if(typeof val[key] === "string"){
            val[key] = Number(val[key])
        }
    }
    else if(type === Boolean){
        if(typeof val[key] !== "boolean") return `${key}: must be a boolean, received ${getType(val[key])}`
    }
    else if(type instanceof Array){
        if(!(val[key] instanceof Array) || !val[key].length) return `${key}: must be an array with at least 1 element, received ${getType(val[key])}`
        
        if(type.length == 1){
            const arrayErrors = handleArrayErrors(key, type, val, options)
            return arrayErrors
        }
        else if(type.length > 1) throw `${key}: invalid type for array`

        
    }
    else if(type instanceof JMultiple) {       
        //check if we have dependsOn instance and move it to the front of the array
        const dependsOn = type.vals.find(item => item instanceof JDependsOn)
        if(dependsOn){
            type.vals = [dependsOn, ...type.vals.filter(item => !(item instanceof JDependsOn))]
        }

        let errs = []
        for (const t of type.vals){
            if(t instanceof JDependsOn){
                const kVal = getNestedObjValue(t.key, options.originalObj)
                if(kVal !== undefined && typeof t.predicate === "function"){
                    if(!(t.predicate(kVal))){
                        delete val[key]
                        return errs
                    }
                }
                else return errs
            }
            const err = getViolations(key, t, val, options)
            if(Array.isArray(err)) errs = errs.concat(err)
            else errs.push(err)
        }
        return options.showOnlyFirstErrorForSameKey && errs.length ? errs[0] : errs
    }

    else if(type instanceof JMinLength) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if(val[key].toString().length < type.val) return `${key}: must be at least ${type.val} characters long`
    }
    else if(type instanceof JMaxLength) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if(val[key].toString().length > type.val) return `${key}: must be at most ${type.val} characters long`
        
    }
    else if(type instanceof JLength) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if(val[key].toString().length != type.val) return `${key}: must be exactly ${type.val} characters long`        
        
    }
    else if(type instanceof JMatch) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if(!(new RegExp(type.reg).test(val[key]))) return `${key}: ${type.errorMsg}`        
    }
    else if(type instanceof JEquals) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if( val[key] !== type.val) return `${key}: must euqal ${type.val}`        
    }
    else if(type instanceof JOneOf) {
        if(!Array.isArray(type.val)) throw `${key}: must be an array`
        if(!type.val.includes(val[key])) return `${key}: must be one of [${type.val.join(", ")}]`  
    }
    else if(type instanceof JDependsOn) {
        const kVal = getNestedObjValue(type.key, options.originalObj)
        if(kVal !== undefined){
            if(type.predicate(kVal)){
                if(val[key] === undefined) return `${key}: is required`
                if(type.types && type.types.length){
                    return getViolations(key, runEach(...type.types), val, options)
                }
            }
        }
    }
    else if(type instanceof JAny){
    //    if(val[key] === undefined) return `${key}: is required`
    }
    else if(type instanceof JInt){

        if(type._castIfString) val[key] = Number(val[key])

        if(!Number.isInteger(val[key])) return `${key}: must be integer`
     }
     else if(type instanceof JPositiveInt){

        if(type._castIfString) val[key] = Number(val[key])

        if(!Number.isInteger(val[key])) return `${key}: must be integer`
        if(val[key] < 1) return `${key}: must be greater than 0`
     }
    else if(type instanceof JDate){
        if(typeof type.format !== "string") return `${key}: fatal error - DATE format must be a string`
        const sep = getDateSeparator(type.format)
        if(sep){
            const validFormatDate = new RegExp("[0-9]{1,2}(SEP)[0-9]{1,2}(SEP)[0-9]{4}".replace(/SEP/g,sep)).test(val[key])
            if(validFormatDate){
                const format = type.format.split(sep)
                const date = val[key].split(sep).map(v=>Number(v))
                try{
                    new Date(val[key]).toISOString()
                    if(format[0][0] == "m" && date[0] > 12 && !isValidDay(date[0],date[1],date[2]) || format[1][0] == "m" && date[1] > 12 && !isValidDay(date[1],date[0],date[2])) return `${key}: invalid date, must be in ${type.format} format`
                }
                catch(err){ 
                    return `${key}: invalid date, must be in ${type.format} format`
                }
            }
            else return `${key}: invalid date, must be in ${type.format} format`
        }
        else return `${key}: fatal error - invalid DATE format passed`
    }
     
    else if(type instanceof JEmail){ 
        //https://stackoverflow.com/a/2932811/1929075
        if(typeof val[key] !== "string" || !(/^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/i.test(val[key]))) return `${key}: invalid email address`
    }
    else if(typeof type === "function"){
        const res = type(val[key])
        if(Array.isArray(res)) return `${key}: ${res[1] ?res[1]:'invalid value'}`  
        if(!res) return `${key}: invalid value`
              
    }
   
    
    return ""

}
const getDateSeparator = (format) => {
    const reg = "[m|d]{1,2}(/|-)[m|d]{1,2}(/|-)[y]{4}"
    if(new RegExp(reg).test(format.toLowerCase())){
        const d_sep = (format.match(/-/g)||[]).length
        const s_sep = (format.match(/\//g)||[]).length
        if(d_sep == 2) return "-"
        if(s_sep == 2) return "/"
    }
    return null
}

const isValidDay = (m, d, y) => {
    const md = {1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 30, 11: 30, 12: 31}
    if(d == 2 && !(y&3||y&15&&!(y%25))) return d > 0 && d <= 29
    return d > 0 && d <= md[m]
    
}

const validator = (spec, val,  prevKey, options) => {

    if(!isObjectLiteral(spec)) throw "invalid spec"

    Object.keys(spec).filter(k => isOptional(k)).forEach(key => {
            const opVal = spec[key]
            const opKey = key.slice(0,-1)
            delete spec[key] 
            if(opKey in val) spec[opKey] = opVal
    })
    //remove extra data
    if(options.ignoreUnknown && isObjectLiteral(val)){
        Object.keys(val).forEach(key => {
            if(!(key in spec)) delete val[key]
        })
    }

    let errors = []
    
    Object.keys(spec).map(key => {
        const error = getViolations(key, spec[key], val, options)
        
        if(Array.isArray(error)){
            errors = errors.concat(error.map(err => prevKey && error != "" ?`${prevKey}.${err}`:err))
        }
        else {
            errors.push(prevKey && error != "" ? `${prevKey}.${error}`:error)
        }
        
    })

    return errors.filter(err => err.includes(':')).map(err => {
        err = err.replace(/#/g,".")
        if(err.includes("undefined")){
            const error = err.split(":")
            return `${error[0]}: is required`
        }
        return err
    })
}

const len = (val) => {
    return new JLength(val)
}

const minLen = (val) => {
    return new JMinLength(val)
}

const maxLen = (val) => {
    return new JMaxLength(val)
}

const match = (val, errorMsg="Invalid value") => {
    return new JMatch(val, errorMsg)
}
const runEach = (...types) => {
    return new JMultiple(types)
}
const equals = (val) => {
    return new JEquals(val)
}

const oneOf = (val) => {
    return new JOneOf(val)
}

const int = () => {
    return new JInt()
}
const pInt = () => {
    return new JPositiveInt()
}
const date = (format = "mm/dd/yyyy") => {
    return new JDate(format)
}

const email = () => {
    return new JEmail()
}

const any = () => {
    return new JAny()
}

const ifKey = (key, predicate = v => true) => {
    return new JDependsOn(key, predicate)
}

const defaultOps = {
    allowEmpty: false,
    ignoreUnknown: true,
    showOnlyFirstErrorForSameKey: false,
    dataSource: "body"

}

//express
const jx = (spec, options) => {
    const ops = {...defaultOps, ...options}

    return (req, res, next) => {
        const data = ops.dataSource == "query" ? req.query: req.body
        ops.originalObj = data
        jebena(spec, data, ops)
        .then(res => {
            if(ops.dataSource == "query") req.query = res
            else req.body = res 
            next()
        })
        .catch(errs => {
            return res.status(400).send({
                "errors": errs
            })
        })
    }
}

const jebena = (spec, val, options = {}) =>{
    return new Promise((resolve, reject) => {
        const ops = {...defaultOps, ...options}
        ops.originalObj = val

        const res = validator(spec, val, null, ops)
        if(res.length) reject([...new Set(res)])
        resolve(val)
    })
}

export {
    jx,
    runEach,
    email,
    minLen,
    maxLen,
    match,
    len,
    equals,
    oneOf,
    ifKey,
    any,
    int,
    pInt,
    date
}
export default jebena
