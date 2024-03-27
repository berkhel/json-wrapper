import { JSONSchemaFaker } from 'json-schema-faker'
import { faker } from "@faker-js/faker";
import Chance from "chance";
JSONSchemaFaker.extend("faker", () => faker);
JSONSchemaFaker.extend("chance", () => new Chance());

export class Fake {
    static jsonStringFromClass(constructor, properties, options) {
        
        let schema = {
            "id": constructor.name,
            "type": "object",
            "properties": properties,
            "required" : Object.keys(properties)
        }
        options.alwaysFakeOptionals = true
        JSONSchemaFaker.option(options);
        return JSON.stringify(JSONSchemaFaker.generate(schema))
    }
}