import _ from 'lodash'
import { JSONSchemaFaker as JsonGenerator } from 'json-schema-faker'
import traverse from 'traverse'

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
 * Although not mandatory, it is recommended that nested objects also extend JSONWrapper.
 * static schema field is mandatory and it must be a valid json schema (see {@link https://json-schema.org | Json-Schema}).
 * If you want to reference other classes with "$ref" (nested usage) is mandatory to include
 *  in the static referencedClasses field all the referenced classes
 * 
 * @example //simple usage
 * class User extends JSONWrapper {
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
 * class App extends JSONWrapper {
 *      static schema = {"type":"object","properties":{
 * "users":{"type":"array","items":{"$ref":"User"}}}}
 *      static referencedClasses = [User]
 * }
 * class User extends JSONWrapper {
 * static schema = {"type":"object","properties":{"country":{"$ref":"Country"}}}
 *     static referencedClasses = [Country]
 * }
 * class Country extends JSONWrapper {
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
 * class User extends JSONWrapper {
 * //schema and classReferenced omitted
 *      constructor(name) {
 *          super();
 *          if(!name) throw Error();
 *          this.name = name;
 *      }
 * }
 * 
 * @example //class that doesn't respect the contract due to the nested object constructor
 * class User extends JSONWrapper {
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
export class JSONWrapper {

    static schema = {}
    static referencedClasses = []


    static #configureGenerator() {
        JsonGenerator.option({
            "refDepthMax": "0",
            "minItems": "1",
            "maxItems": "1",
            "requiredOnly": true,
            "omitNulls": false
        })
    }

    static get markedSchema() {
        if (!this._markedSchema) {
            let schema = _.merge({}, this.schema)
            schema.properties["$class"] = { "enum": [this.name] }
            traverse(schema).forEach(function (node) {
                if (node["$ref"]) {
                    this.update({ "$class": { "enum": [node["$ref"]] } })
                }
            })
            schema.required = ["$class"]
                .concat(this.schema?.required || [])
                .concat(Object.entries(schema.properties)
                    .filter(([key, value]) => value["$class"] || value.type === "object" || value.type === "array")
                    .map(([key, value]) => key))
            this._markedSchema = schema;
        }
        return this._markedSchema
    }

    static minimalObject()  {

        
        const classReferences = [this].concat(this.referencedClasses)

        const replace$classMarkersWithClassInstances = (node) => {
            function replaceMarked(entry, withClass) {
                delete entry.$class
                return _.merge(new withClass.prototype.constructor(), entry);
            }
            const foundClass = classReferences.find(cls => cls.name === node["$class"])
            return foundClass? replaceMarked(node, foundClass) : node
        }

        function markersToClassObjects(node){
            if(node["$class"]) this.update(replace$classMarkersWithClassInstances(node))
        }

        return traverse(JsonGenerator.generate(this.markedSchema)).map(markersToClassObjects)

    }



    /**
     * Factory method
     * @param {string} json - a json string compatible with the class from which this method is called
     * @returns {JSONWrapper} an instance of the class from which this method is called
     */
    static fromJsonString(json) {
        return this.fromJsonObject(JSON.parse(json))
    }

    /**
     * Factory method
     * @param {string} jsonObj - a json object compatible with the class from which this method is called
     * @returns {JSONWrapper} an instance of the class from which this method is called
     */
    static fromJsonObject(jsonObj) {
        JSONWrapper.#configureGenerator()
        return JSONWrapper.#jsonObjectToClassObject(jsonObj, this.prototype.constructor)
    }

    /**
     * @returns {string} the json string from the actual state of the instance
     */
    toJsonString() {
        return JSON.stringify(this)
    }

    /**
     * @returns {Object} the json object from the actual state of the instance
     */
    toJsonObject() {
        return JSON.parse(JSON.stringify(this))
    }

    /**
     * @private
     * @param {Object} jsonObject - a json object
     * @param {new() => T} constructor - a constructor of any type, it must be possible to call it with new constructor()
     * @returns {T} an instance of type T containing deep copied data from jsonObject
     */
    static #jsonObjectToClassObject(jsonObject, constructor) {
        let tempObj = constructor.minimalObject?.() || new constructor()
        let res = _.mergeWith(tempObj, jsonObject, JSONWrapper.#handleObjects);
        return res 
    }


    /**
     * @private
     * @param {Object} classObjArray - array at some point in the state structure of the JSONWrapper object
     * @param {Object} jsonObjArray - corresponding array of {@link classObjArray} in the json object
     * @returns {(Array.<Array> | Array.<Object> | undefined)}
     */
    static #handleObjects(classObjArray, jsonObjArray) {
        if(_.isObject(classObjArray) && !_.isArray(classObjArray)){
            return _.merge(classObjArray.constructor.minimalObject?.() || new classObjArray.constructor(), jsonObjArray)
        }
        const isArrayOfObjects = it => _.isArray(it) && _.isObject(it[0])
        const isArrayOfArrays = it => _.isArray(it) && _.isArray(it[0])
        if (_.isArray(jsonObjArray) && isArrayOfObjects(classObjArray)) {
            return jsonObjArray.map(isArrayOfArrays(classObjArray) ?
                jsonObjArrayElem => JSONWrapper.#handleObjects(classObjArray[0], jsonObjArrayElem) :
                jsonObjArrayElem => JSONWrapper.#jsonObjectToClassObject(jsonObjArrayElem, classObjArray[0].constructor)
            )
        }
    }
}
