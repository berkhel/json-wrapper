const { JSONSchemaFaker } = require( "json-schema-faker" )

class Fake {
    static jsonStringFromClass( constructor, properties, options ) {
        
        let schema = {
            "id" : constructor.name,
            "type" : "object",
            "properties" : properties,
            "required" : Object.keys( properties )
        }
        options.alwaysFakeOptionals = true
        JSONSchemaFaker.option( options )
        return JSON.stringify( JSONSchemaFaker.generate( schema ) )
    }
}

module.exports = Fake