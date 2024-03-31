/* eslint-disable no-undef */
class Account extends JSONWrapper {
    //schema and classReferenced omitted
    constructor( name ) {
        super()
        if( !name ) throw Error()
        this.name = name
    }
}
 
 
class User extends JSONWrapper {
    //schema omitted
    static referencedClasses = [Country]
}
class Country {
    constructor( countryCode ) { 
        if( !countryCode ) throw Error()
        this.countryCode = countryCode
    }
}
