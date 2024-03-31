/* global jasmine describe it beforeEach expect spyOn */
const JSONWrapper = require( "../../" )
const fs = require( "fs" )
const path = require( "path" )
const Fake = require( "../fixtures/util/fake.js" )

class Pair extends JSONWrapper {

    static schema = {
        "id" : "Pair",
        "type" : "object",
        "properties" : {
            "firstNumber" : {
                "type" : "number"
            },
            "secondNumber" : {
                "type" : "number"
            }
        }
    }

    sum() {
        return this.firstNumber + this.secondNumber
    }
}

class Letter extends JSONWrapper {

    static schema = {
        "id" : "Letter",
        "type" : "object",
        "properties" : {
            "label" : {
                "type" : "string"
            }
        }
    }

    toUpper() {
        return this.label.toUpperCase()
    }
}

class Credential extends JSONWrapper {

    static schema = {
        "id" : "Credential",
        "type" : "object",
        "properties" : {
            "numberPairs" : {
                "type" : "array",
                "items" : {
                    "$ref" : "Pair"
                }
            },
            "matrix" : {
                "type" : "array",
                "items" : {
                    "type" : "array",
                    "items" : {
                        "$ref" : "Letter"
                    }
                }
            }
        }
    }

    static referencedClasses = [Pair, Letter]

    toString() {
        return "Sorry, credentials are secret."
    }

    getUsername() {
        return this.username
    }
    getPassword() {
        return "*".repeat( this.password.length )
    }
}

class User extends JSONWrapper {

    static schema = {
        "id" : "User",
        "type" : "object",
        "properties" : {
            "credentials" : {
                "type" : "array",
                "items" : {
                    "$ref" : "Credential"
                }
            },
            "firstName" : {
                "type" : "string"
            },
            "lastName" : {
                "type" : "string"
            },
            "address" : {
                "type" : "object",
                "properties" : {
                    "street" : {
                        "type" : "string"
                    },
                    "city" : {
                        "type" : "string"
                    }
                }
            }
        }
    }

    static referencedClasses = [
        Credential
    ]

    toString() {
        return this.fullname
    }

    get fullAddress() {
        return this.address.street + ", " + this.address.city
    }

    get fullname() {
        return this.firstName + " " + this.lastName
    }

}

class Product extends JSONWrapper {
    static schema = {
        "id" : "Product",
        "type" : "object",
        "properties" : {
            "uid" : {
                "type" : "string"
            }
        }
    }
    uid = "98765"
}

class Door extends JSONWrapper {
    static schema = {
        "id" : "Door",
        "type" : "object",
        "properties" : {
            "name" : "string"
        }
    }

    ring() {
        return "dlin dlon!"
    }
}

class House extends JSONWrapper {
    static schema = {
        "id" : "House",
        "type" : "object",
        "properties" : {
            "door" : {
                "$ref" : "Door"
            }
        }
    }
    static referencedClasses = [Door]
}


class Recursive extends JSONWrapper {

    static schema = {
        "id" : "Recursive",
        "type" : "object",
        "properties" : {
            "children" : {
                "type" : "array",
                "items" : {
                    "$ref" : "Recursive"
                }
            }
        }
    }

    static referencedClasses = [Recursive]


    get level() {
        return "L3"
    }


    print() {
        console.log( "Hello world" )
    }
}


let request = fs.readFileSync( path.resolve( "./spec/fixtures/resources/sample-request.json" ) )

describe( "----UNIT TESTS----\n", () => {
    describe( "Nested immediate class objects", () => {
        it( "should expose working methods", () => {
            let aHouse = House.fromJsonString( "{\"door\":{\"name\":\"White\"}}" )
            expect( aHouse.door.ring() ).toBe( "dlin dlon!" )
        })
    })
    describe( "A class object instantiate with a json smaller than its schema", () => {
        it( "shouldn't change the json data structure", () => {
            let json = { "firstName" : "Rico", "lastName" : "Suarez" }
            let aUser = User.fromJsonObject( json )
            expect( aUser.toJsonObject() ).toEqual( json )
        })
    })
    describe( "", () => {

        let aUser
        let requestObj
        beforeEach( () => {
            requestObj = JSON.parse( request )
            aUser = User.fromJsonObject( requestObj )
        })

        describe( "The resulting top class object", () => {
            it( "should be able to override the 'toString' method", () => {
                expect( "" + aUser ).toBe( "John Doe" )
            })
            it( "should be able to expose working methods", () => {
                expect( aUser.fullname ).toBe( "John Doe" )
            })
            it( "should be able to return the same data structure if not modified", () => {
                expect( aUser.toJsonObject() ).toEqual( JSON.parse( request ) )
            })
        })

        describe( "The resulting top class object", () => {
            beforeEach( () => {
                aUser.firstName = "Adam"
                aUser.address.city = "Manchester"
            })

            it( "should be able to modify the internal data", () => {
                expect( aUser.toString() ).toBe( "Adam Doe" )
                expect( aUser.fullAddress ).toBe( "221b Baker Street, Manchester" )
            })

            it( "shouldn't modify the original plain object", () => {
                expect( requestObj.firstName ).toBe( "John" )
                expect( requestObj.address.city ).toBe( "London" )
            })
        })

        describe( "Nested class objects", () => {
            let cred
            beforeEach( () => {
                cred = aUser.credentials[1]
            })
            it( "should be able to override the 'toString' method", () => {
                expect( "" + cred ).toBe( "Sorry, credentials are secret." )
            })
            it( "should be able to expose custom methods", () => {
                expect( cred.getPassword() ).toBe( "********" )
            })
        })

        describe( "Given a nested class object has been specified in the constructor", () => {
            describe( "the nested objects inside arrays", () => {
                let pairArray
                beforeEach( () => {
                    pairArray = aUser.credentials[0].numberPairs
                })
                it( "should expose working methods", () => {
                    expect( pairArray[0].sum() ).toBe( 11 )
                })
            })

            describe( "the nested objects inside arrays of arrays", () => {
                let matrix
                beforeEach( () => {
                    matrix = aUser.credentials[1].matrix
                })
                it( "should expose working methods", () => {
                    expect( matrix[2][2].toUpper() ).toBe( "M" )
                })
            })
        })
    })

    describe( "Given a class that initialize a field in the constructor", () => {
        describe( "the returning data structure", () => {
            it( "should contain that field", () => {
                expect( Product.fromJsonString( "{ \"name\" : \"shoes\"}" ).toJsonObject() )
                    .toEqual({ "name" : "shoes", "uid" : "98765" })
            })

        })
    })

    describe( "Void json", () => {
        it( "should be allowed", () => {
            expect( Product.fromJsonString( "{}" ).toJsonObject() ).toEqual({ "uid" : "98765" })
        })
    })

    describe( "Invalid json", () => {
        it( "shouldn't be allowed", () => {
            expect( () => Product.fromJsonString( "{]" ) ).toThrowError( SyntaxError )
        })
    })

    describe( "Recursive nested classes", () => {
        it( "should be able to work properly", () => {
            const recursive = Recursive.fromJsonString( "{\"children\":[{\"children\":[{\"children\":[{\"children\":null}]}]}]}" )
            expect( recursive.children[0].children[0].children[0].level ).toBe( "L3" )
        })
    })

})

describe( "----INTEGRATION TESTS----\n", () => {
    describe( "Minimal object", () => {
        let json = { "credentials" : [{ "numberPairs" : [{}], "matrix" : [[{}]] }] }

        it( "should call constructors of the top class once", () => {
            let constructorUser = spyOn( User.prototype, "constructor" ).and.callThrough()
            let minimalUser = User.minimalObject( json, new User() )
            expect( constructorUser ).toHaveBeenCalledTimes( 1 )
            constructorUser.calls.reset()

        })
        it( "should call constructors of referenced classes once", () => {
            let constructorCred = spyOn( Credential.prototype, "constructor" ).and.callThrough()
            let minimalUser = User.minimalObject( json, new User() )
            expect( constructorCred ).toHaveBeenCalledTimes( 1 )
            constructorCred.calls.reset()

        })
        it( "shouldn't call constructors of referenced classes of referenced classes", () => {
            let constructorPair = spyOn( Pair.prototype, "constructor" ).and.callThrough()
            let constructorLett = spyOn( Letter.prototype, "constructor" ).and.callThrough()
            let minimalUser = User.minimalObject( json, new User() )
            expect( constructorPair ).not.toHaveBeenCalled()
            expect( constructorLett ).not.toHaveBeenCalled()
            constructorPair.calls.reset()
            constructorLett.calls.reset()

        })
    })
    describe( "The 'fromJsonObject' method", () => {
        let requestObj
        beforeEach( () => {
            requestObj = JSON.parse( request )
        })
        it( "of instantiated top class should have been called once", () => {
            let spyUser = spyOn( User, "fromJsonObject" ).and.callThrough()
            let aUser = User.fromJsonObject( requestObj )
            expect( spyUser ).toHaveBeenCalledTimes( 1 )
            spyUser.calls.reset()
        })


    })

    describe( "The 'fromJsonObject' method of nested classes", () => {
        let requestObj
        const classes = [Credential, Pair, Letter]
        let spy
        const testCases = {
            "User" : {
                "numberOfInstances" : 1,
                "timesReferencedBy" : {}
            },
            "Credential" : {
                "numberOfInstances" : 2,
                "timesReferencedBy" : {
                    "User" : 1
                }
            },
            "Pair" : {
                "numberOfInstances" : 4,
                "timesReferencedBy" : {
                    "Credential" : 1
                }
            },
            "Letter" : {
                "numberOfInstances" : 13,
                "timesReferencedBy" : {
                    "Credential" : 1
                }
            }

        }
        beforeEach( () => {
            requestObj = JSON.parse( request )
        })
        classes.forEach( ( testClass ) => {
            it( "should have been called once for each instance", () => {
                spy = spyOn( testClass, "fromJsonObject" ).and.callThrough()
                User.fromJsonObject( requestObj )
                let info = testCases[testClass.name]
                expect( spy ).toHaveBeenCalledTimes( info.numberOfInstances )
                spy.calls.reset()

            })

        })

    })
})


describe( "----PERFORMANCE TESTS----\n", () => {
    let timer
    let schema
    beforeEach( () => {
        timer = new jasmine.Timer()
        schema = { "children" : { "type" : "array", "items" : { "$ref" : "Recursive" } } }
    })
    describe( "For deep json with", () => {
        it( "10 levels (binary tree) it should execute under 0.2s", () => {
            let x10DeepJson = Fake.jsonStringFromClass( Recursive, schema,
                { "refDepthMin" : "10", "refDepthMax" : "10", "minItems" : "2", "maxItems" : "2" })

            Recursive.maxLevel = 10
            timer.start()
            Recursive.fromJsonString( x10DeepJson ).toJsonObject()
            expect( timer.elapsed() ).toBeLessThan( 200 )
        })
        it( "100 levels it should execute under 0.1s", () => {
            let x100DeepJson = Fake.jsonStringFromClass( Recursive, schema,
                { "refDepthMin" : "100", "refDepthMax" : "100", "minItems" : "1", "maxItems" : "1" })
            Recursive.maxLevel = 100
            timer.start()
            Recursive.fromJsonString( x100DeepJson ).toJsonObject()
            expect( timer.elapsed() ).toBeLessThan( 100 )
        })
        it( "1000 levels should execute under 0.2s", () => {
            let x1000DeepJson = Fake.jsonStringFromClass( Recursive, schema,
                { "refDepthMin" : "1000", "refDepthMax" : "1000", "minItems" : "1", "maxItems" : "1" })
            Recursive.maxLevel = 1000
            timer.start()
            Recursive.fromJsonString( x1000DeepJson ).toJsonObject()
            expect( timer.elapsed() ).toBeLessThan( 200 )
        })
    })
})








