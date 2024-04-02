const assert = require( "node:assert" ).strict
const _ = require( "lodash" )
const JsonGenerator = require( "json-schema-faker" ).JSONSchemaFaker
const traverse = require( "traverse" )

/**
 *
 * Enrich a json object with behaviour from a class object.
 * Objects created with initializers are called plain objects, because they are
 *  instances of Object, but not any other object type (see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects#creating_new_objects | MDN Reference}).
 * Plain object and json object are synonymous here.
 * @contract The standard use of this class is to extend it
 *  and then expose methods in the child class in order to add behavior to a json object.
 * It must be possible to call, without arguments, the constructor of the child class, without throwing any exception.
 * This constraint apply also to the classes of the nested objects of the child class.
 * Although not mandatory, it is recommended that nested objects also extend JsonWrapper.
 * static schema field is mandatory and it must be a valid json schema (see {@link https://json-schema.org | Json-Schema}).
 * If you want to reference other classes with "$ref" (nested usage) is mandatory to include
 *  in the static referencedClasses field all the referenced classes
 *
 * @example //simple usage
 * class User extends JsonWrapper {
 *  static schema = {"type" : "object", "properties" : {
 *   "first_name" : {"type":"string"},
 *   "last_name" : {"type":"string"}}}
 *  getFullname(){
 *    return this.first_name + " " + this.last_name
 *  }
 * }
 * let aUser = User.fromJsonString('{first_name: "John", last_name: "Doe"}')
 * console.log(aUser.getFullname()) //prints "John Doe"
 *
 * @example //nested usage
 * class App extends JsonWrapper {
 *      static schema = {"type":"object","properties":{
 * "users":{"type":"array","items":{"$ref":"User"}}}}
 *      static referencedClasses = [User]
 * }
 * class User extends JsonWrapper {
 * static schema = {"type":"object","properties":{"country":{"$ref":"Country"}}}
 *     static referencedClasses = [Country]
 * }
 * class Country extends JsonWrapper {
 * static schema = {"type" :"object","properties":{"language":{"type":"string"},"code":{"type":"string"}}}
 *      get locale() {
 *          return this.language + "_" + this.code
 *      }
 * }
 * let app = App.fromJsonString(`{
 *   users : [{
 *      first_name: "John",
 *      last_name: "Doe",
 *      country: {
 *         language : "it"
 *         code : "IT"
 *      }}]}`)
 * console.log(app.users[0].country.locale) //prints "it_IT"
 *
 * @example //constructor that doesn't respect the contract
 * class User extends JsonWrapper {
 * //schema and classReferenced omitted
 *      constructor(name) {
 *          super();
 *          if(!name) throw Error();
 *          this.name = name;
 *      }
 * }
 *
 * @example //class that doesn't respect the contract due to the nested object constructor
 * class User extends JsonWrapper {
 * //schema omitted
 * static referencedClasses = [Country]
 * }
 * class Country {
 *     constructor(countryCode) {
 *          if(!countryCode) throw Error();
 *          this.countryCode = countryCode;
 *     }
 * }
 *
 */
class JsonWrapper {

    /**
     * the json schema that every instance of this class must follow
     * @type {object}
     */
    static schema = {}

    /**
     * array of all the classes that are referenced with '$ref' in {@link schema}
     * @type {Array.<new() => object>} 
     */
    static referencedClasses = []

    static {
        JsonWrapper.#configureGenerator()
    }


    /**
     * Factory method
     * @param {string} json - a json string compatible with {@link schema}
     * @return {JsonWrapper} an instance of the class from which this method is called
     */
    static fromJsonString( json ) {
        return this.fromJsonObject( JSON.parse( json ) )
    }

    /**
     * Factory method
     * @param {string} jsonObj - a json object compatible with {@link schema}
     * @return {JsonWrapper} an instance of the class from which this method is called
     */
    static fromJsonObject( jsonObj ) {
        return _.mergeWith( this.minimalObject( jsonObj ), jsonObj, JsonWrapper.#handleObjects )
    }

    /**
     * @return {string} the json string representing the inner data of the instance
     */
    toJsonString() {
        return JSON.stringify( this )
    }

    /**
     * @return {Object} the json object representing a copy of the inner data of the instance
     */
    toJsonObject() {
        return JSON.parse( JSON.stringify( this ) )
    }


    /**
     * @private
     * @param {Object} classObjNode - object at some point in the state structure of the JsonWrapper object
     * @param {Object} jsonObjNode - corresponding object of {@link classObjNode} in the json object
     * @return {(Object | Array | undefined)}
     */
    static #handleObjects( classObjNode, jsonObjNode ) {
        if ( classObjNode instanceof JsonWrapper ) {
            return classObjNode.constructor.fromJsonObject( jsonObjNode )
        }
        if ( _.isArray( classObjNode ) && _.isArray( jsonObjNode ) ) {
            return jsonObjNode.map( ( jsonObjNodeElem ) =>
                JsonWrapper.#handleObjects( classObjNode[0], jsonObjNodeElem ) )
        }
    }

    /**
     * The module json-schema-faker is used only to generate a minimal object,
     *  a template object with one element for each node.
     * That one element will be used in {@link #handleObjects} as a template to remap each element of the json received.
     * For this reason, this configuration is made to avoid:
     * * to much nodes to be generated 
     * * fields to be populated with random values
     * * multiple recursive references (one is sufficient)
     */
    static #configureGenerator() {
        JsonGenerator.option({
            "refDepthMax" : "1",
            "minItems" : "1",
            "maxItems" : "1",
            "requiredOnly" : true,
            "omitNulls" : false,
        })
    }

    /**
     * Generate an instance of JsonWrapper with only one element for each array
     * The $ref tags in the schema are converted to $class tags and then to instances of classes
     * @param {object} jsonObject 
     * @returns {JsonWrapper} 
     */
    static minimalObject( jsonObject ) {
        const tipify = ( object, withClass ) => {
            return _.merge( new withClass.prototype.constructor(), object )
        }

        function deleteBecauseAbsentInJsonObject() {
            if ( !traverse( jsonObject ).has( this.path ) ) {
                this.delete()
                return true
            }
        }


        let that = this
        function $classMarkersToClassInstances( node ) {
            if ( !deleteBecauseAbsentInJsonObject.apply( this ) && _.isObject( node ) && Reflect.has( node, "$class" ) ) {
                const foundClass = that.referencedClasses.find( cls => cls.name === node["$class"] )
                delete node.$class
                return foundClass ? tipify( node, foundClass ) : node
            }
        }

        return tipify( traverse( JsonGenerator.generate( this.$classMarkedSchema ) ).map( $classMarkersToClassInstances ), this )
    }


    /**
     * $ref tags are mapped to $class tags in order to be handled by {@link minimalObject}
     */
    static get $classMarkedSchema() {
        if ( !this._markedSchema ) {
            const schema = _.cloneDeep( this.schema )
            traverse( schema ).forEach( function( node ) {
                if ( node["$ref"] ) {
                    this.update({"$class" : {"enum" : [node["$ref"]]}})
                }
            })
            schema.required = Object.entries( schema.properties )
                .filter( ( [, value] ) => value["$class"] || value.type === "object" || value.type === "array" )
                .map( ( [key] ) => key )
            this._markedSchema = schema
        }
        return this._markedSchema
    }
}

module.exports = JsonWrapper
