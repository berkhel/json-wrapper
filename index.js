import { JsonWrapper } from "./classes.js";

class A extends JsonWrapper {
    static schema = {
        "id" : "A",
        "type" : "object",
        "properties" : {
            "order": "number"
        }
    }

    doubleOrder(){
        return this.order * 2
    }
}

let a = A.fromJsonObject({ "order" : 4})

console.log(a.doubleOrder())