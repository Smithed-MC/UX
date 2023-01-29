import validateVersion, { version } from "./version";
import Schema from "validate";

const urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/

const pack = new Schema({
    id: {
        type: String,
        required: true,
        length: {min:3}
    },
    display: {
        name: {
            type: String,
            required: true,
            length: {min: 3}
        },
        description: {
            type: String,
            required: true,
            length: {min: 3}
        },
        icon: {
            type: String,
            required: false,
            match: urlRegex
        },
        webPage: {
            type: String,
            required: false,
            match: urlRegex
        },
        hidden: {
            type: Boolean,
            required: false
        }
    },
    versions: [{
        schema: version
    }],
    categories: {
        type: Array<string>,
        required: false
    },
    messages: {
        type: Array<string>,
        required: false
    }
})

export default function validatePack(data: any) {
    const packValidationResults = pack.validate(data)
    if(packValidationResults.length === 0) {
        for(let v of data.versions) {
            packValidationResults.concat(validateVersion(v))
        }
    }
    return packValidationResults
} 