const Multiple = function (vals) {this.vals = vals}
const MinLength = function (val) {this.val = val}
const MaxLength = function (val){this.val = val}
const Length = function (val){this.val = val}
const Match = function (reg,errorMsg) {this.reg = reg; this.errorMsg = errorMsg}
const Equals = function (val) {this.val = val}
const OneOf = function (val) {this.val = val}
const DependsOn = function (key, predicate) {this.key = key; this.predicate = predicate}
const Email = function (){};
const Any = function (){};

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

const getViolations = (key, type, val, options) => {
    
    if(!(type instanceof Multiple) && val[key] === undefined) return `${key}: is required`

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
            const x = handleArrayErrors(key, type, val, options)
            return x
        }
        else if(type.length > 1) throw `${key}: invalid type for array`

        
    }
    else if(type instanceof Multiple) {       
        //check if we have dependsOn instance and move it to the front of the array
        const dependsOn = type.vals.find(item => item instanceof DependsOn)
        if(dependsOn){
            type.vals = [dependsOn, ...type.vals.filter(item => !(item instanceof DependsOn))]
        }

        const errs = []
        for (const t of type.vals){
            if(t instanceof DependsOn){
                if(typeof t.predicate === "function"){
                    const kVal = getNestedObjValue(t.key, options.originalObj)
                    if(!(t.predicate(kVal))){
                        delete val[key]
                        return errs
                    }
                    else continue
                }
                else throw `${key}: second argument of dependsOn must be a function`
            }
            const err = getViolations(key, t, val, options)
            if(Array.isArray(err)) errs = errs.concat(err)
            else errs.push(err)
        }
        return options.showOnlyFirstErrorForSameKey && errs.length ? errs[0] : errs
    }

    else if(type instanceof MinLength) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if(val[key].toString().length < type.val) return `${key}: must be at least ${type.val} characters long`
    }
    else if(type instanceof MaxLength) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if(val[key].toString().length > type.val) return `${key}: must be at most ${type.val} characters long`
        
    }
    else if(type instanceof Length) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if(val[key].toString().length != type.val) return `${key}: must be exactly ${type.val} characters long`        
        
    }
    else if(type instanceof Match) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if(!(new RegExp(type.reg).test(val[key]))) return `${key}: ${type.errorMsg}`        
    }
    else if(type instanceof Equals) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if( val[key] !== type.val) return `${key}: must euqal ${type.val}`        
    }
    else if(type instanceof OneOf) {
        if(!Array.isArray(type.val)) throw `${key}: must be an array`
        if(!type.val.includes(val[key])) return `${key}: must be one of -> ${type.val.join(", ")}`  
    }
    else if(type instanceof DependsOn) {
        if(typeof type.predcate !== "function") throw `${key}: second argument of dependsOn must be a function`
        const kVal = getNestedObjValue(type.key, options.originalObj)
        if(type.predcate(kVal) && val[key] == undefined) return `${key}: required`
    }
    else if(type instanceof Any){
       if(val[key] == undefined) return `${key}: is required`
    }
    else if(type instanceof Email){ 
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

const getNestedObjValue = (keys, obj) => {
    if(!obj) return null
    const ks = keys.split(".")
    if(ks.length > 1){
        return getNestedObjValue(ks.slice(1).join("."),obj[ks[0]])
    }
    else return obj[ks[0]]
    
}

const length = (val) => {
    return new Length(val)
}

const minLength = (val) => {
    return new MinLength(val)
}

const maxLength = (val) => {
    return new MaxLength(val)
}

const match = (val, errorMsg="Invalid value") => {
    return new Match(val, errorMsg)
}
const all = (...vals) => {
    return new Multiple(vals)
}
const equals = (val) => {
    return new Equals(val)
}

const oneOf = (val) => {
    return new OneOf(val)
}

const dependsOn = (key, predicate) => {
    return new DependsOn(key, predicate)
}

const isEmail = () => {
    return new Email()
}

const any = () => {
    return new Any()
}

const defaultOps = {
    allowEmpty: false,
    ignoreUnknown: true,
    showOnlyFirstErrorForSameKey: false,
    dataSource: "body"

}

const jebenaExpress = (spec, options) => {
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
    jebenaExpress,
    all,
    isEmail,
    minLength,
    maxLength,
    match,
    length,
    equals,
    oneOf,
    dependsOn,
    any
    
}
export default jebena
