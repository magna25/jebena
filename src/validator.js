const Multiple = function (vals) {this.vals = vals}
const MinLength = function (val) {this.val = val}
const MaxLength = function (val){this.val = val}
const Length = function (val){this.val = val}
const Match = function (reg,errorMsg) {this.reg = reg, this.errorMsg = errorMsg}
const Equals = function (val) {this.val = val}
const Email = function (){};
const StringNumber = function (){};

const validator = (spec, val,  prevKey = null,) => {

    if(!isObjectLiteral(spec)) throw "invalid spec"

    Object.keys(spec).filter(k => isOptional(k)).forEach(key => {
            const opVal = spec[key]
            const opKey = key.slice(0,-1)
            delete spec[key] 
            if(opKey in val) spec[opKey] = opVal
    })

    //remove extra data
    if(isObjectLiteral(val)){
        Object.keys(val).forEach(key => {
            if(!(key in spec)) delete val[key]
        })
    }

    let errors = []
    
    Object.keys(spec).forEach(key => {
        const error = getViolations(key, spec[key], val)
        if(Array.isArray(error)){
            errors = errors.concat(error.map(err => prevKey && error != "" ?`${prevKey}.${err}`:err))
        }
        else errors.push(prevKey && error != "" ? `${prevKey}.${error}`:error)
        
    })

    return errors.filter(err => err != "").map(err => {
        const e = err.replace("#",".")
        
        if(e.includes("undefined")){
            const er = e.split(":")
            return `${er[0]}: is missing`
        }
        return e
    })
}

const isObjectLiteral = (obj) =>{
    return typeof obj !== null && typeof obj !== undefined && obj.constructor === Object
}

const handleArrayErrors = (key, type, val) => {
    let errs = []

    val[key].forEach((v,i) => {
        let err = getViolations(key, type[0],{[key]:v})
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
                errs.push(`${err[0]}[${i}]${err[1]}`)
            }
        }
        
    })

    return errs
}

const isOptional = (key) => {
    return key[key.length-1] == "?" ? true: false
}


const getType = (val) => {
    if(val instanceof Array && typeof val === "object"){
        return "empty array"
    }
    return typeof val
}


const getViolations = (key, type, val, allowNull = false) => {

    if(isObjectLiteral(type)){
        
        if(isObjectLiteral(val) && key in val) return validator(type, val[key],key)
        return `${key}: must be an object, received ${getType(val[key])}`
    }
    else if(type === String) {
        if(typeof val[key] !== "string") return `${key}: must be a string, received ${getType(val[key])}`
        if(!allowNull &&  val[key] == "") return `${key}: can't be empty`
    }
    else if(type === Number){
        if(typeof val[key] !== "number") return `${key}: must be a number, received ${getType(val[key])}`
    }
    else if(type === Boolean){
        if(typeof val[key] !== "boolean") return `${key}: must be a boolean, received ${getType(val[key])}`
    }
    else if(type instanceof Array){
        if(!(val[key] instanceof Array) || !val[key].length) return `${key}: must be an array with at least 1 element, received ${getType(val[key])}`
        
        if(type.length == 1){
            return handleArrayErrors(key, type, val)
        }
        else if(type.length > 1) throw `${key}: invalid type for array`

        
    }
    else if(type instanceof Multiple) {
        const errs = []
        for (const t of type.vals){
            const err = getViolations(key, t, val)
            if(Array.isArray(err)) errs = errs.concat(err)
            else errs.push(err)
        }
        return errs
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
    else if(type instanceof StringNumber) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a number, received ${getType(val[key])}`
        if(isNaN(val[key])) return `${key}: must be a number`        
        
    }
    else if(type instanceof Match) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if(!(new RegExp(type.reg).test(val[key]))) return `${key}: ${type.errorMsg}`        
    }
    else if(type instanceof Equals) {
        if(typeof val[key] !== "string" && typeof val[key] !== "number") return `${key}: must be a string or number, received ${getType(val[key])}`
        if( val[key] !== type.val) return `${key}: must euqal ${type.val}`        
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

const isEmail = () => {
    return new Email()
}

const isStringNumber = () => {
    return new StringNumber()
}

const jebenaExpress = (spec, checkIfValidJSON = true) => {
    return (req, res, next) => {
        jebena(spec, req.body)
        .then(res => {
            req.body = res
            next()
        })
        .catch(errs => {
            return res.status(400).send({
                "message": "Bad Request",
                "errors": errs
            })
        })
    }
}

const jebena = (spec, val) =>{
    return new Promise((resolve, reject) => {
        const res = validator(spec, val)
        if(res.length) reject(res)
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
    isStringNumber,
    
}
export default jebena
