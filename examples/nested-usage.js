/* eslint-disable no-undef */
class App extends JsonWrapper {
    static schema = {
        "id" : "App",
        "type" : "object",
        "properties" : {
            "users" : {
                "type" : "array",
                "items" : {
                    "$ref" : "User"
                }
            }
        }
    }

    static referencedClasses = [User]
}

class User extends JsonWrapper {
    static schema = {
        "id" : "User",
        "type" : "object",
        "properties" : {
            "country" : { 
                "$ref" : "Country" 
            }
        }
    }
    static referencedClasses = [Country]
}
class Country extends JsonWrapper {
    static schema = {
        "type" : "object",
        "properties" : {
            "language" : {
                "type" : "string" 
            },
            "code" : {
                "type" : "string"
            }
        }
    }

    get locale() {
        return this.language + "_" + this.code
    }

}

let app = App.fromJsonString( `{
   users : [{
      first_name: "John",
      last_name: "Doe",
      country: {
          language : "it"
          code : "IT"
       }
      }]
  }` )
console.log( app.users[0].country.locale ) //prints "it_IT"