/* eslint-disable no-undef */
class User extends JSONWrapper {
    static schema = {
        "id" : "User",
        "type" : "object",
        "properties" : {
            "first_name" : {"type" : "string"},
            "last_name" : {"type" : "string"}
        }
    }
    getFullname() {
        return this.first_name + " " + this.last_name
    }    
}
let aUser = User.fromJsonString( "{first_name: \"John\", last_name: \"Doe\"}" )
console.log( aUser.getFullname() ) //prints "John Doe"